import { Table } from 'antd'
type Row = { label: string; value: number | null }
export default function DataTable({
  bars,
  unit,
}: {
  bars: Row[]
  unit: string
}) {
  return (
    <Table<Row>
      rowKey="label"
      pagination={false}
      scroll={{ x: 340 }}
      dataSource={bars}
      columns={[
        { title: 'Ölçü', dataIndex: 'label', width: 190 },
        {
          title: 'Sonuç',
          dataIndex: 'value',
          render: (v: number | null) =>
            v === null ? 'Bilinmiyor' : v.toLocaleString('tr-TR') + ' ' + unit,
        },
      ]}
    />
  )
}
