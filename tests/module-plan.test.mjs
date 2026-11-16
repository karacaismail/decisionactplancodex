import assert from 'node:assert/strict'
import test from 'node:test'
import { catalog } from '../src/modules/module-plan/catalog.ts'

test('Altı modülün kayıtları ve özellikleri tek bir sahibe bağlıdır', () => {
  assert.equal(catalog.modules.length, 6)
  const types = catalog.modules.flatMap((m) => m.records)
  assert.equal(types.length, 25)
  assert.equal(new Set(types).size, 25)
  const names = catalog.modules.flatMap((m) => m.features.map((f) => f.id))
  assert.equal(new Set(names).size, names.length)
  assert.equal(catalog.ownerOf('gecis')?.id, 'karar')
  assert.equal(catalog.ownerOf('kanit')?.id, 'plan')
  assert.equal(catalog.ownerOf('devir')?.id, 'rapor')
  assert.equal(catalog.ownerOf('makbuz')?.id, 'esitleme')
  assert.equal(catalog.ownerOf('uydurma'), undefined)
})
test('Kapsam ve arama aynı özelliğe uygulanır', () => {
  assert.deepEqual(
    catalog.search('sqlite', 'temel').map((m) => m.id),
    ['esitleme'],
  )
  assert.deepEqual(catalog.search('sqlite', 'kosullu'), [])
  assert.equal(
    catalog.search('', 'kosullu').flatMap((m) => m.features).length,
    5,
  )
  assert.deepEqual(
    catalog.search('KANIT SÜRÜMÜ', 'temel').map((m) => m.id),
    ['plan'],
  )
  assert.equal(catalog.search('hiç yok', 'tumu').length, 0)
})
