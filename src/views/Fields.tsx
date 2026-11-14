import { legacyId } from '../dossier'
import { Button, DatePicker, Input, InputNumber, Select, Radio } from 'antd'
import { Plus, Trash } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import type { Field, Value } from '../data/steps'
export default function FieldInput({
  f,
  v,
  id,
  onChange,
}: {
  f: Field
  v: Value | undefined
  id: string
  onChange: (v: Value) => void
}) {
  const props = { id, 'aria-label': f.label }
  if (
    f.kind === 'pick' &&
    f.choices &&
    (f.choices.length === 2 ||
      ['repeat', 'effort', 'loss', 'impact', 'strength'].includes(f.key))
  )
    return (
      <Radio.Group
        {...props}
        className="choice-group"
        value={v || undefined}
        onChange={(e) => onChange(e.target.value)}
        options={f.choices}
      />
    )
  if (f.kind === 'pick')
    return (
      <Select
        {...props}
        value={v || undefined}
        placeholder="Seçin"
        options={f.choices?.map((x) => ({ label: x, value: x }))}
        onChange={onChange}
      />
    )
  if (f.kind === 'number')
    return (
      <div className="unit-input">
        <InputNumber
          {...props}
          value={typeof v === 'number' ? v : null}
          min={f.min}
          onChange={(n) => onChange(n ?? '')}
          controls={false}
          placeholder="Sayı girin"
        />
        {f.unit && <span>{f.unit}</span>}
      </div>
    )
  if (f.kind === 'date')
    return (
      <DatePicker
        {...props}
        value={typeof v === 'string' && dayjs(v).isValid() ? dayjs(v) : null}
        format="DD.MM.YYYY"
        placeholder="Tarih seçin"
        onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : '')}
      />
    )
  if (f.kind === 'long')
    return (
      <Input.TextArea
        {...props}
        value={String(v ?? '')}
        autoSize={{ minRows: 3, maxRows: 8 }}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  if (f.kind === 'list') {
    const rows = Array.isArray(v) ? (v as Record<string, string>[]) : []
    return (
      <div className="repeat-list">
        {rows.map((r, n) => (
          <div
            key={f.key === 'options' ? r._id || (r.Çözüm ? legacyId(r) : n) : n}
            className="repeat-row"
          >
            <div className="split">
              <b>Kayıt {n + 1}</b>
              <Button
                type="text"
                aria-label={'Kayıt ' + (n + 1) + ' sil'}
                icon={<Trash />}
                onClick={() => onChange(rows.filter((_, i) => i !== n))}
              />
            </div>
            {Object.entries(f.listChoices ?? {}).map(([key, choices]) => (
              <label key={key}>
                <span>{key}</span>
                <Select
                  aria-label={key}
                  allowClear
                  value={r[key] || undefined}
                  options={choices.map((value) => ({ value, label: value }))}
                  onChange={(value) =>
                    onChange(
                      rows.map((row, i) =>
                        i === n ? { ...row, [key]: value ?? '' } : row,
                      ),
                    )
                  }
                />
              </label>
            ))}
            {[...(f.columns ?? []), ...(f.optionalColumns ?? [])].map((c) => (
              <label key={c}>
                <span>{c}</span>
                <Input
                  value={r[c] ?? ''}
                  onChange={(e) =>
                    onChange(
                      rows.map((row, i) =>
                        i === n
                          ? {
                              ...row,
                              ...(f.key === 'options'
                                ? {
                                    _id:
                                      row._id ||
                                      (row.Çözüm
                                        ? legacyId(row)
                                        : crypto.randomUUID()),
                                  }
                                : {}),
                              [c]: e.target.value,
                            }
                          : row,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
        ))}
        <Button
          icon={<Plus />}
          onClick={() =>
            onChange([
              ...rows,
              f.key === 'options' ? { _id: crypto.randomUUID() } : {},
            ])
          }
        >
          {f.label} için kayıt ekle
        </Button>
      </div>
    )
  }
  return (
    <Input
      {...props}
      value={String(v ?? '')}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
