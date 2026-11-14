import help from '../data/methodHelp.json'
type Entry = {
  steps: string[]
  example: string
  tip?: string
  warning?: string
}
export default function MethodHelp({ slug }: { slug: string }) {
  const guide = (help as Record<string, Entry>)[slug]
  if (!guide) return null
  return (
    <div className="book-help">
      <h4>Nasıl uygulanır?</h4>
      <ol>
        {guide.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <h4>Örnek</h4>
      <p>{guide.example}</p>
      {guide.warning && (
        <>
          <h4>Dikkat</h4>
          <p>{guide.warning}</p>
        </>
      )}
      {guide.tip && (
        <>
          <h4>İpucu</h4>
          <p>{guide.tip}</p>
        </>
      )}
    </div>
  )
}
