import { DatabaseSync } from 'node:sqlite'
import {
  randomBytes,
  createHash,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'
import { isDeepStrictEqual, promisify } from 'node:util'
import {
  confirmStrategyChoice,
  recordCycleReview,
  recordDecision,
  validatePlan,
  report,
} from '../src/domain.ts'
const derive = promisify(scrypt)
const digest = (s) => createHash('sha256').update(s).digest('hex')
const secret = () => randomBytes(32).toString('hex')
function fail(status, message) {
  throw Object.assign(Error(message), { status })
}
function text(value, max = 120) {
  return (
    typeof value === 'string' && value.trim().length > 0 && value.length <= max
  )
}
function checkDecisionHistory(old, p, member, canRecover) {
  const previousOwner = old?.answers['01']?.owner
  const owner = p.answers['01']?.owner
  if (
    previousOwner &&
    previousOwner !== owner &&
    member !== previousOwner &&
    !canRecover
  )
    fail(403, 'Karar sahibini yalnız kayıtlı karar sahibi değiştirebilir.')
  const resources = (plan) => (plan?.history ?? []).filter((h) => h.stage === 4)
  const earlier = resources(old),
    received = resources(p)
  for (const [i, h] of earlier.entries()) {
    if (
      !isDeepStrictEqual(h, received[i]) &&
      !isDeepStrictEqual({ ...h, stale: true }, received[i])
    )
      fail(403, 'Geçmiş kaynak kararı korunmalıdır.')
  }
  for (const grant of received.slice(earlier.length)) {
    if (grant.outcome !== 'İlerleyin') continue
    if (!old && grant.imported && grant.stale) continue
    if (
      grant.imported ||
      member !== owner ||
      grant.owner !== member ||
      (previousOwner && member !== previousOwner)
    )
      fail(403, 'Kaynak iznini yalnız planın karar sahibi verir.')
    try {
      recordDecision(
        { ...p, history: p.history.slice(0, p.history.indexOf(grant)) },
        4,
        grant,
      )
    } catch (e) {
      fail(400, e.message)
    }
  }
  function additions(key) {
    const before = old?.[key] ?? [],
      after = p[key] ?? []
    for (const [index, entry] of before.entries()) {
      const next = after[index]
      if (isDeepStrictEqual(entry, next)) continue
      if (
        key === 'strategyChoices' &&
        !entry.revoked &&
        member === previousOwner &&
        isDeepStrictEqual({ ...entry, revoked: true }, next)
      )
        continue
      fail(403, 'Geçmiş karar kaydı korunmalıdır.')
    }
    return after.slice(before.length)
  }
  for (const [key, archiveFlag] of [
    ['strategyChoices', 'revoked'],
    ['cycleReviews', 'imported'],
  ]) {
    const added = additions(key)
    for (const entry of added) {
      if (!old && entry[archiveFlag]) continue
      if (
        entry[archiveFlag] ||
        !owner ||
        member !== owner ||
        (previousOwner && member !== previousOwner) ||
        entry.owner !== member
      )
        fail(403, 'Yeni kararı yalnız planın karar sahibi verebilir.')
      try {
        if (key === 'strategyChoices') {
          const chosen = confirmStrategyChoice(
            { ...p, strategyChoices: old?.strategyChoices ?? [] },
            member,
          ).strategyChoices.at(-1)
          if (
            !chosen ||
            !['question', 'choice', 'basis', 'transition'].every(
              (k) => entry[k] === chosen[k],
            )
          )
            fail(400, 'Seçim ile dayanağı uyuşmuyor.')
        } else {
          if (!old) fail(400, 'Önce kaynak kararını kaydedin.')
          const result = recordCycleReview(old, entry)
          const valid = result.cycleReviews.at(-1)
          if (
            valid.grant !== entry.grant ||
            valid.choice !== entry.choice ||
            !isDeepStrictEqual(result.history, p.history) ||
            !isDeepStrictEqual(result.strategyChoices, p.strategyChoices) ||
            !isDeepStrictEqual(
              result.foundation?.decisions,
              p.foundation?.decisions,
            )
          )
            fail(400, 'Karar, güncel yol ve kaynak izniyle uyuşmuyor.')
        }
      } catch (error) {
        fail(400, error.message)
      }
    }
  }
}
async function read(req) {
  let bytes = 0
  const data = []
  for await (const part of req) {
    bytes += part.length
    if (bytes > 8 * 1024 * 1024) fail(413, 'Dosya çok büyük.')
    data.push(part)
  }
  try {
    const obj = JSON.parse(Buffer.concat(data).toString())
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return obj
  } catch {}
  fail(400, 'Geçerli bir kayıt gönderin.')
}
export function teamApi(path) {
  const db = new DatabaseSync(path)
  db.exec(`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS spaces(id TEXT PRIMARY KEY,name TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,space TEXT REFERENCES spaces(id),name TEXT,handle TEXT,role TEXT,salt TEXT,hash TEXT,active INTEGER DEFAULT 1,UNIQUE(space,handle));
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,member TEXT REFERENCES members(id),expires INTEGER);
 CREATE TABLE IF NOT EXISTS invites(hash TEXT PRIMARY KEY,space TEXT REFERENCES spaces(id),role TEXT,expires INTEGER);
 CREATE TABLE IF NOT EXISTS plans(space TEXT REFERENCES spaces(id),id TEXT,revision INTEGER,body TEXT,PRIMARY KEY(space,id));
 CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY,space TEXT,actor TEXT,action TEXT,planId TEXT,revision INTEGER,detail TEXT,at TEXT);
 CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,space TEXT,planId TEXT,planName TEXT,revision INTEGER,author TEXT,authorName TEXT,note TEXT,state TEXT,reviewerName TEXT,reply TEXT,created TEXT,closed TEXT,executive TEXT,actions TEXT,UNIQUE(space,planId,revision));
 CREATE INDEX IF NOT EXISTS events_space ON events(space,seq);`)
  const sql = (s) => db.prepare(s)
  const tx = (fn) => {
    db.exec('BEGIN IMMEDIATE')
    try {
      const value = fn()
      db.exec('COMMIT')
      return value
    } catch (e) {
      db.exec('ROLLBACK')
      throw e
    }
  }
  const rates = new Map()
  const log = (space, actor, action, detail, planId = null, revision = null) =>
    sql(
      'INSERT INTO events(space,actor,action,planId,revision,detail,at) VALUES(?,?,?,?,?,?,?)',
    ).run(
      space,
      actor,
      action,
      planId,
      revision,
      detail,
      new Date().toISOString(),
    )
  async function account(body) {
    if (
      !text(body.name, 80) ||
      !text(body.password, 256) ||
      body.password.length < 12
    )
      fail(400, 'Adınızı ve en az 12 karakterlik parolanızı yazın.')
    const salt = secret()
    return {
      id: randomUUID(),
      name: body.name.trim(),
      handle: body.name.trim().toLocaleLowerCase('tr'),
      salt,
      hash: (await derive(body.password, salt, 64)).toString('hex'),
    }
  }
  function member(space, role, a) {
    if (
      sql('SELECT id FROM members WHERE space=? AND handle=?').get(
        space,
        a.handle,
      )
    )
      fail(409, 'Bu ad bu alanda kullanılıyor.')
    sql(
      'INSERT INTO members(id,space,name,handle,role,salt,hash) VALUES(?,?,?,?,?,?,?)',
    ).run(a.id, space, a.name, a.handle, role, a.salt, a.hash)
  }
  function info(id) {
    const u = sql(
      'SELECT m.id,m.name,m.role,s.id AS space,s.name AS team FROM members m JOIN spaces s ON s.id=m.space WHERE m.id=? AND m.active=1',
    ).get(id)
    return u
      ? {
          user: { id: u.id, name: u.name, role: u.role },
          workspace: { id: u.space, name: u.team },
        }
      : null
  }
  function session(res, id) {
    const key = secret()
    sql('INSERT INTO sessions VALUES(?,?,?)').run(
      digest(key),
      id,
      Date.now() + 8 * 3600000,
    )
    res.setHeader(
      'Set-Cookie',
      'atlas_team=' +
        key +
        '; HttpOnly; SameSite=Strict; Path=/api/team; Max-Age=28800',
    )
    return info(id)
  }
  async function api(req, res, next) {
    const route = (req.url || '').split('?')[0]
    if (!route.startsWith('/api/team/')) {
      if (next) return next()
      res.writeHead(404)
      return res.end()
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    try {
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || ''))
        fail(403, 'Bu hizmet yalnız yerel adreste açılır.')
      const action = route.slice(10),
        post = req.method === 'POST'
      const reads = ['session', 'list', 'members', 'owners', 'audit', 'reviews']
      if (
        (reads.includes(action) && req.method !== 'GET') ||
        (!reads.includes(action) && !post)
      )
        fail(405, 'Bu işlem desteklenmiyor.')
      if (
        post &&
        (req.headers.origin !== 'http://' + req.headers.host ||
          !/^application\/json\b/.test(req.headers['content-type'] || ''))
      )
        fail(403, 'İstek kaynağı doğrulanamadı.')
      const body = post ? await read(req) : {}
      const token =
        (req.headers.cookie || '').match(
          /(?:^|;\s*)atlas_team=([a-f0-9]{64})(?:;|$)/,
        )?.[1] || ''
      const logged = sql(
        'SELECT member FROM sessions WHERE hash=? AND expires>?',
      ).get(digest(token), Date.now())
      const me = logged && info(logged.member),
        space = me?.workspace.id,
        user = me?.user
      let data
      if (['login', 'join', 'create'].includes(action)) {
        const key = req.socket.remoteAddress || 'local',
          window = Math.floor(Date.now() / 60000),
          entry = rates.get(key)
        const count = entry?.window === window ? entry.count + 1 : 1
        rates.set(key, { window, count })
        if (count > 40) fail(429, 'Bir dakika sonra tekrar deneyin.')
      }
      if (action === 'session') data = me || null
      else if (action === 'create') {
        if (!text(body.workspace)) fail(400, 'Kurum adı gerekiyor.')
        const a = await account(body),
          id = randomUUID()
        data = tx(() => {
          sql('INSERT INTO spaces VALUES(?,?)').run(id, body.workspace.trim())
          member(id, 'admin', a)
          log(id, a.name, 'Alan açıldı', body.workspace.trim())
          return session(res, a.id)
        })
      } else if (action === 'login') {
        if (
          !text(body.name, 80) ||
          !text(body.password, 256) ||
          !text(body.workspace)
        )
          fail(400, 'Giriş bilgilerini tamamlayın.')
        const u = sql(
          'SELECT * FROM members WHERE space=? AND handle=? AND active=1',
        ).get(body.workspace, body.name.trim().toLocaleLowerCase('tr'))
        const hash = await derive(
          body.password,
          u?.salt || 'atlas-invalid-login',
          64,
        )
        if (!u || !timingSafeEqual(hash, Buffer.from(u.hash, 'hex')))
          fail(401, 'Giriş bilgileri doğrulanamadı.')
        data = session(res, u.id)
      } else if (action === 'join') {
        if (!text(body.code, 128)) fail(400, 'Davet kodunu yazın.')
        const a = await account(body),
          key = digest(body.code.trim())
        data = tx(() => {
          const i = sql('SELECT * FROM invites WHERE hash=? AND expires>?').get(
            key,
            Date.now(),
          )
          if (!i) fail(400, 'Davet geçersiz veya süresi dolmuş.')
          member(i.space, i.role, a)
          sql('DELETE FROM invites WHERE hash=?').run(key)
          log(i.space, a.name, 'Üye katıldı', a.name)
          return session(res, a.id)
        })
      } else {
        if (!me) fail(401, 'Kurum alanına tekrar giriş yapın.')
        if (
          req.headers['x-atlas-space'] !== space ||
          req.headers['x-atlas-member'] !== user.id
        )
          fail(409, 'Oturum değişti. Bu alanı yeniden açın.')
        if (
          ['invite', 'remove', 'members'].includes(action) &&
          user.role !== 'admin'
        )
          fail(403, 'Bu işlem için yönetici yetkisi gerekir.')
        if (action === 'logout') {
          sql('DELETE FROM sessions WHERE hash=?').run(digest(token))
          res.setHeader(
            'Set-Cookie',
            'atlas_team=; HttpOnly; SameSite=Strict; Path=/api/team; Max-Age=0',
          )
          data = { ok: true }
        } else if (action === 'invite') {
          if (!['editor', 'reader', 'reviewer'].includes(body.role))
            fail(400, 'Davet yetkisini seçin.')
          const code = secret()
          sql('INSERT INTO invites VALUES(?,?,?,?)').run(
            digest(code),
            space,
            body.role,
            Date.now() + 86400000,
          )
          log(
            space,
            user.name,
            'Davet oluşturuldu',
            body.role === 'editor'
              ? 'Düzenleme'
              : body.role === 'reviewer'
                ? 'İnceleme'
                : 'Okuma',
          )
          data = { code }
        } else if (action === 'remove') {
          const target = sql(
            'SELECT * FROM members WHERE id=? AND space=? AND active=1',
          ).get(String(body.id), space)
          if (!target || target.role === 'admin')
            fail(400, 'Bu üyelik kaldırılamadı.')
          tx(() => {
            sql('UPDATE members SET active=0 WHERE id=?').run(target.id)
            sql('DELETE FROM sessions WHERE member=?').run(target.id)
            log(space, user.name, 'Erişim kaldırıldı', target.name)
          })
          data = { ok: true }
        } else if (action === 'owners') {
          if (!['editor', 'admin'].includes(user.role))
            fail(403, 'Düzenleme yetkisi gerekiyor.')
          data = sql(
            "SELECT name FROM members WHERE space=? AND active=1 AND role IN ('admin','editor') ORDER BY name",
          )
            .all(space)
            .map((m) => m.name)
        } else if (action === 'members')
          data = sql(
            'SELECT id,name,role FROM members WHERE space=? AND active=1 ORDER BY name',
          ).all(space)
        else if (action === 'audit')
          data = sql(
            'SELECT seq,actor,action,planId,revision,detail,at FROM events WHERE space=? ORDER BY seq DESC LIMIT 250',
          ).all(space)
        else if (action === 'list')
          data = sql('SELECT body FROM plans WHERE space=? ORDER BY rowid')
            .all(space)
            .map((r) => JSON.parse(r.body))
        else if (action === 'reviews')
          data = sql(
            'SELECT id, planId,planName,revision,author,authorName,note,state,reviewerName,reply,created,closed FROM reviews WHERE space=? ORDER BY rowid DESC',
          ).all(space)
        else if (action === 'packet') {
          const r = sql(
            'SELECT executive,actions FROM reviews WHERE space=? AND id=?',
          ).get(space, String(body.id))
          if (!r) fail(404, 'İnceleme bulunamadı.')
          data = r
        } else if (action === 'submit') {
          if (!['admin', 'editor'].includes(user.role))
            fail(403, 'Bu hesap inceleme isteği açamaz.')
          if (!text(body.note, 2000)) fail(400, 'İnceleme nedenini yazın.')
          data = tx(() => {
            const row = sql(
              'SELECT body,revision FROM plans WHERE space=? AND id=?',
            ).get(space, String(body.id))
            if (!row || row.revision !== body.revision)
              fail(409, 'Plan değişti. Listeyi yenileyin.')
            if (
              sql(
                'SELECT id FROM reviews WHERE space=? AND planId=? AND revision=?',
              ).get(space, body.id, body.revision)
            )
              fail(409, 'Bu sürüm zaten incelemeye gönderildi.')
            const p = JSON.parse(row.body),
              id = randomUUID()
            sql(
              'INSERT INTO reviews(id,space,planId,planName,revision,author,authorName,note,state,created,executive,actions) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',
            ).run(
              id,
              space,
              p.id,
              p.name,
              p.revision,
              user.id,
              user.name,
              body.note.trim(),
              'pending',
              new Date().toISOString(),
              report(p, 'executive'),
              report(p, 'action'),
            )
            log(
              space,
              user.name,
              'İnceleme istendi',
              body.note.trim(),
              p.id,
              p.revision,
            )
            return { id }
          })
        } else if (action === 'resolve') {
          if (!['admin', 'reviewer'].includes(user.role))
            fail(403, 'İnceleyen yetkisi gerekir.')
          if (
            !['approved', 'returned'].includes(body.outcome) ||
            !text(body.note, 2000)
          )
            fail(400, 'Sonucu ve gerekçeyi yazın.')
          data = tx(() => {
            const row = sql('SELECT * FROM reviews WHERE space=? AND id=?').get(
              space,
              String(body.id),
            )
            if (!row) fail(404, 'İnceleme bulunamadı.')
            if (row.author === user.id)
              fail(403, 'İsteği başka bir üye incelemelidir.')
            const plan = sql(
              'SELECT revision FROM plans WHERE space=? AND id=?',
            ).get(space, row.planId)
            if (row.state !== 'pending' || row.revision !== plan.revision)
              fail(409, 'Bu istek kapandı veya plan değişti.')
            sql(
              'UPDATE reviews SET state=?,reviewerName=?,reply=?,closed=? WHERE id=?',
            ).run(
              body.outcome,
              user.name,
              body.note.trim(),
              new Date().toISOString(),
              row.id,
            )
            log(
              space,
              user.name,
              body.outcome === 'approved'
                ? 'Sürüm onaylandı'
                : 'Düzeltme istendi',
              body.note.trim(),
              row.planId,
              row.revision,
            )
            return { ok: true }
          })
        } else if (action === 'save') {
          if (!['admin', 'editor'].includes(user.role))
            fail(403, 'Bu hesap yalnız okuyabilir.')
          const p = body.plan
          if (!validatePlan(p) || !Number.isSafeInteger(p.revision + 1))
            fail(400, 'Plan biçimi geçersiz.')
          data = tx(() => {
            const prev = sql(
              'SELECT revision,body FROM plans WHERE space=? AND id=?',
            ).get(space, p.id)
            if ((prev?.revision ?? 0) !== p.revision)
              fail(
                409,
                'Başka bir kullanıcı bu planı değiştirdi. Kopyanızı indirin veya kayıtlı sürümü açın.',
              )
            const old = prev ? JSON.parse(prev.body) : null
            const oldOwner = old?.answers['01']?.owner,
              newOwner = p.answers['01']?.owner
            const eligible = (name) =>
              sql(
                "SELECT 1 AS ok FROM members WHERE space=? AND active=1 AND name=? AND role IN ('admin','editor')",
              ).get(space, name)
            const canRecover =
              user.role === 'admin' &&
              oldOwner &&
              oldOwner !== newOwner &&
              !eligible(oldOwner)
            checkDecisionHistory(old, p, user.name, canRecover)
            if (
              newOwner &&
              oldOwner !== newOwner &&
              !p.example &&
              !eligible(newOwner)
            )
              fail(400, 'Karar sahibini etkin üyelerden seçin.')
            const next = {
              ...p,
              revision: p.revision + 1,
              updatedAt: new Date().toISOString(),
            }
            sql(
              'INSERT INTO plans VALUES(?,?,?,?) ON CONFLICT(space,id) DO UPDATE SET revision=excluded.revision,body=excluded.body',
            ).run(space, p.id, next.revision, JSON.stringify(next))
            sql(
              "UPDATE reviews SET state='superseded',closed=? WHERE space=? AND planId=? AND state='pending' AND revision<?",
            ).run(next.updatedAt, space, p.id, next.revision)
            const groups = {
              handover: 'Devir kontrolü',
              answers: 'Plan adımları',
              history: 'Kararlar',
              strategyChoices: 'Stratejik seçimler',
              cycleReviews: 'Sonuç kararları',
              evidence: 'Kanıtlar',
              work: 'Görevler',
              publications: 'Raporlar',
              changes: 'Sınır değişiklikleri',
              name: 'Plan adı',
            }
            const detail = old
              ? Object.entries(groups)
                  .filter(
                    ([k]) => JSON.stringify(old[k]) !== JSON.stringify(p[k]),
                  )
                  .map(([, label]) => label)
                  .join(', ')
              : p.name
            log(
              space,
              user.name,
              old ? 'Plan güncellendi' : 'Plan oluşturuldu',
              detail || p.name,
              p.id,
              next.revision,
            )
            return next
          })
        } else fail(404, 'İşlem bulunamadı.')
      }
      res.end(JSON.stringify(data))
    } catch (e) {
      res.statusCode = e.status || 500
      res.end(
        JSON.stringify({
          error: e.status ? e.message : 'Yerel hizmet işlemi tamamlayamadı.',
        }),
      )
    }
  }
  api.close = () => db.close()
  return api
}
