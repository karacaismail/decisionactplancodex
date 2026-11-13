import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer, request } from 'node:http'
import { teamApi } from '../server/team.mjs'
import { createPlan } from '../src/domain.ts'

test('kurum alanı erişimi, sürüm çakışması, tek kullanımlık davet ve geçmiş', async (t) => {
  const api = teamApi(':memory:'),
    server = createServer(api)
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  t.after(async () => {
    await new Promise((r) => server.close(r))
    api.close()
  })
  const origin = 'http://127.0.0.1:' + server.address().port
  const sessions = new Map()
  async function call(path, body, cookie = '') {
    const r = await fetch(origin + '/api/team/' + path, {
      method: body ? 'POST' : 'GET',
      headers: {
        origin,
        'content-type': 'application/json',
        cookie,
        ...sessions.get(cookie),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await r.json(),
      key = r.headers.get('set-cookie')?.split(';')[0]
    if (key && data.user)
      sessions.set(key, {
        'x-atlas-space': data.workspace.id,
        'x-atlas-member': data.user.id,
      })
    return { status: r.status, body: data, cookie: key }
  }
  const login = { name: 'Deniz', password: randomUUID() }
  const a = await call('create', { ...login, workspace: 'Üretim kurulu' })
  assert.equal(a.status, 200)
  const me = await call('session', null, a.cookie)
  assert.equal(me.body.user.role, 'admin')
  let plan = createPlan('Fason üretim')
  const saved = await call('save', { plan }, a.cookie)
  assert.equal(saved.body.revision, 1)
  assert.equal((await call('save', { plan }, a.cookie)).status, 409)
  assert.equal((await call('list', null)).status, 401)
  const b = await call('create', { ...login, workspace: 'Diğer ekip' })
  assert.equal((await call('list', null, b.cookie)).body.length, 0)
  const i = await call('invite', { role: 'reader' }, a.cookie)
  const reader = await call('join', {
    code: i.body.code,
    name: 'Ece',
    password: login.password,
  })
  assert.equal(reader.status, 200)
  assert.equal(
    (
      await call('join', {
        code: i.body.code,
        name: 'Başka',
        password: login.password,
      })
    ).status,
    400,
  )
  assert.equal(
    (await call('save', { plan: saved.body }, reader.cookie)).status,
    403,
  )
  assert.equal(
    (await call('invite', { role: 'editor' }, reader.cookie)).status,
    403,
  )
  const ledger = await call('audit', null, reader.cookie)
  assert.ok(
    ledger.body.some(
      (e) => e.planId === plan.id && e.revision === 1 && e.actor === 'Deniz',
    ),
  )
  const invite = await call('invite', { role: 'reviewer' }, a.cookie)
  const reviewer = await call('join', {
    name: 'Bora',
    password: login.password,
    code: invite.body.code,
  })
  assert.equal(reviewer.status, 200)
  const ticket = await call(
    'submit',
    { id: plan.id, revision: 1, note: 'Kaynak sınırını inceleyin.' },
    a.cookie,
  )
  assert.equal(ticket.status, 200)
  assert.equal(
    (
      await call(
        'resolve',
        { id: ticket.body.id, outcome: 'approved', note: 'Uygun' },
        a.cookie,
      )
    ).status,
    403,
  )
  assert.equal(
    (
      await call(
        'resolve',
        { id: ticket.body.id, outcome: 'approved', note: 'İncelendi' },
        reviewer.cookie,
      )
    ).status,
    200,
  )
  assert.equal((await call('save', { plan: saved.body }, a.cookie)).status, 200)
  const tickets = await call('reviews', null, reader.cookie)
  assert.equal(tickets.body[0].revision, 1)
  assert.equal(tickets.body[0].state, 'approved')
  const ticket2 = await call(
    'submit',
    { id: plan.id, revision: 2, note: 'Yeni sürüm' },
    a.cookie,
  )
  const updated = (await call('list', null, a.cookie)).body[0]
  assert.equal((await call('save', { plan: updated }, a.cookie)).status, 200)
  assert.equal(
    (
      await call(
        'resolve',
        { id: ticket2.body.id, outcome: 'approved', note: 'İncelendi' },
        reviewer.cookie,
      )
    ).status,
    409,
  )
  assert.equal(
    (await call('remove', { id: reader.body.user.id }, a.cookie)).status,
    200,
  )
  assert.equal((await call('list', null, reader.cookie)).status, 401)
  // The upload has started before removal, but the body finishes after removal.
  const ei = await call('invite', { role: 'editor' }, a.cookie)
  const ed = await call('join', {
    code: ei.body.code,
    name: 'Duru',
    password: randomUUID(),
  })
  const started = Promise.withResolvers(),
    finished = Promise.withResolvers()
  server.once('request', () => started.resolve())
  const slow = request(
    origin + '/api/team/save',
    {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        cookie: ed.cookie,
        ...sessions.get(ed.cookie),
      },
    },
    (r) => {
      r.resume()
      finished.resolve(r.statusCode)
    },
  )
  slow.on('error', finished.reject)
  slow.write('{"plan":')
  await started.promise
  await call('remove', { id: ed.body.user.id }, a.cookie)
  slow.end(JSON.stringify(updated) + '}')
  assert.equal(await finished.promise, 401)
  await call('logout', {}, a.cookie)
  assert.equal((await call('list', null, a.cookie)).status, 401)
  assert.equal(
    (await call('login', { ...login, workspace: me.body.workspace.id })).status,
    200,
  )
})
