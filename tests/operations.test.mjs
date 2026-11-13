import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createPlan,
  report,
  validatePlan,
  recordDecision,
} from '../src/domain.ts'
import {
  workItems,
  updateWork,
  newWork,
  launchPlan,
} from '../src/operations.ts'
test('bir karardan tek görev çıkar, kapanış kanıtı rapora ulaşır', () => {
  let p = recordDecision(createPlan('Arşiv'), 0, {
    outcome: 'Bekletin',
    reason: 'İzin bekleniyor',
    owner: 'Ayşe',
    task: 'İzni doğrula',
  })
  const [w] = workItems(p)
  assert.equal(w.title, 'İzni doğrula')
  assert.throws(() => updateWork(p, w.id, 'Tamamlandı', ''), /kapanış/i)
  p = updateWork(p, w.id, 'Tamamlandı', 'Belge geldi')
  assert.equal(workItems(p).length, 1)
  assert.match(report(p, 'action'), /Belge geldi/)
  assert.ok(validatePlan(JSON.parse(JSON.stringify(p))))
})
test('başlangıç yolu ve elle eklenen görev JSON ile korunur', () => {
  const p = launchPlan('Atölye', 'takeover')
  assert.equal(p.answers['00'].start, 'Devralınan iş')
  const q = newWork(p, {
    title: 'Teslimi incele',
    owner: 'Ali',
    stage: 2,
    due: '2030-01-01',
  })
  assert.equal(workItems(q)[0].owner, 'Ali')
  assert.ok(validatePlan(q))
  assert.equal(validatePlan({ ...q, work: [{ id: 'yanlış' }] }), false)
  assert.equal(launchPlan('Bakım', 'danger').answers['02'].danger, 'Var')
})

test('eski karardan çıkan görev yürütülmez ve açık sayılmaz', async () => {
  let p = recordDecision(createPlan('Hat'), 0, {
    outcome: 'Bekletin',
    reason: 'Kontrol',
    owner: 'Ali',
    task: 'Teklifi takip et',
  })
  p = recordDecision(p, 0, {
    outcome: 'Durdurun',
    reason: 'Zarar var',
    owner: 'Ali',
    task: 'Açık sözleri kapat',
  })
  const { activeWork } = await import('../src/operations.ts')
  assert.deepEqual(
    activeWork(p).map((t) => t.title),
    ['Açık sözleri kapat'],
  )
  assert.throws(
    () => updateWork(p, workItems(p)[0].id, 'Yürütülüyor', ''),
    /güncel/i,
  )
})
