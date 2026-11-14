import { Button, Input, InputNumber, Select } from 'antd'
import { dateLabel } from '../domain'
import type { Pledge } from '../preparationMethods'
type Props = {
  permits: { value: string; label: string; disabled?: boolean }[]
  pay: (id: string) => void
  canPay: boolean
  rows: Pledge[]
  disabled: boolean
  proofs: { value: string; label: string }[]
  update: (fn: (rows: Pledge[]) => Pledge[]) => void
}
export default function Pledges({
  rows,
  disabled,
  proofs,
  update,
  permits,
  pay,
  canPay,
}: Props) {
  function edit(id: string, key: keyof Pledge, value: string) {
    update((list) =>
      list.map((r) => (r.id === id ? { ...r, [key]: value } : r)),
    )
  }
  return (
    <section className="fields">
      <h4>Borçlar ve ayrılan para</h4>
      <p>
        Harcama izni bir üst sınırdır. Bir iş için para ayırdıysanız ayrı kayıt
        açın. Aynı ödeme için borç varsa o borcu seçin.
      </p>
      {rows.map((r, i) => (
        <fieldset className="fields" key={r.id}>
          <legend>
            {i + 1}. {r.kind === 'reserve' ? 'ayrılan tutar' : 'ödeme'}
          </legend>
          {r.paidOn && <p>Ödendi. {dateLabel(r.paidOn)}</p>}
          {r.kind === 'reserve' && (
            <>
              <label>
                <span>İlgili harcama izni</span>
                <Select
                  aria-label="İlgili harcama izni"
                  disabled={disabled || !!r.paidOn}
                  allowClear
                  value={r.permit || undefined}
                  options={permits}
                  onChange={(v) => edit(r.id, 'permit', v ?? '')}
                />
              </label>
              <label>
                <span>Aynı ödeme için kayıtlı borç</span>
                <Select
                  aria-label="Aynı ödeme için kayıtlı borç"
                  disabled={disabled || !!r.paidOn}
                  allowClear
                  placeholder="Ayrı bir ödeme"
                  value={r.debtId || undefined}
                  options={rows
                    .filter(
                      (x) =>
                        x.kind !== 'reserve' &&
                        (!x.paidOn || x.id === r.debtId),
                    )
                    .map((x) => ({
                      value: x.id,
                      label: x.name || 'Adsız borç',
                    }))}
                  onChange={(v) => edit(r.id, 'debtId', v ?? '')}
                />
              </label>
            </>
          )}
          <label>
            <span>Ödemenin adı</span>
            <Input
              disabled={disabled || !!r.paidOn}
              value={r.name}
              onChange={(e) => edit(r.id, 'name', e.target.value)}
            />
          </label>
          <label>
            <span>
              {r.paidOn
                ? 'Ödenen tutar'
                : r.kind === 'reserve'
                  ? 'Ayrılan tutar'
                  : 'Henüz ödenmemiş tutar'}
            </span>
            <InputNumber
              disabled={disabled || !!r.paidOn}
              min={0}
              precision={2}
              controls={false}
              value={r.amount ? Number(r.amount) : null}
              onChange={(n) => edit(r.id, 'amount', n == null ? '' : String(n))}
            />
          </label>
          <label>
            <span>Ödemenin son günü</span>
            <Input
              disabled={disabled || !!r.paidOn}
              type="date"
              value={r.due}
              onChange={(e) => edit(r.id, 'due', e.target.value)}
            />
          </label>
          <label>
            <span>Ödemeyi onaylayan kişi</span>
            <Input
              disabled={disabled || !!r.paidOn}
              value={r.owner}
              onChange={(e) => edit(r.id, 'owner', e.target.value)}
            />
          </label>
          <label>
            <span>Ödemenin dayanağı</span>
            <Select
              aria-label="Ödemenin dayanağı"
              disabled={disabled || !!r.paidOn}
              allowClear
              value={r.proof || undefined}
              options={
                r.proof && !proofs.some((x) => x.value === r.proof)
                  ? [
                      ...proofs,
                      { value: r.proof, label: 'Bağlı kanıt kaldırıldı' },
                    ]
                  : proofs
              }
              onChange={(v) => edit(r.id, 'proof', v ?? '')}
            />
          </label>
          {!r.paidOn && !r.debtId && (
            <Button
              disabled={disabled || !canPay || !(Number(r.amount) > 0)}
              onClick={() => pay(r.id)}
            >
              Ödemeyi harcamaya geçir
            </Button>
          )}
          <Button
            disabled={
              disabled || !!r.paidOn || rows.some((x) => x.debtId === r.id)
            }
            onClick={() =>
              update((list) => list.filter((item) => item.id !== r.id))
            }
          >
            Bu ödemeyi kaldır
          </Button>
        </fieldset>
      ))}
      <Button
        disabled={disabled}
        onClick={() =>
          update((list) => [
            ...list,
            {
              id: crypto.randomUUID(),
              name: '',
              amount: '',
              due: '',
              owner: '',
              proof: '',
            },
          ])
        }
      >
        Ödeme satırı ekle
      </Button>
      <Button
        disabled={disabled}
        onClick={() =>
          update((list) => [
            ...list,
            {
              id: crypto.randomUUID(),
              kind: 'reserve',
              name: '',
              amount: '',
              due: '',
              owner: '',
              proof: '',
            },
          ])
        }
      >
        Ayrılan para ekle
      </Button>
    </section>
  )
}
