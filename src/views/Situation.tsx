import { Button } from 'antd'
import type { Plan } from '../domain'
import { situation } from '../research'
import { crossQuestions } from '../researchCatalog'
export default function Situation({
  p,
  visit,
}: {
  p: Plan
  visit: (step: string) => void
}) {
  return (
    <section className="step-help" aria-label="Durum özeti">
      <h4>Durum özeti</h4>
      <div className="dossier-grid">
        {situation(p).map((g) => (
          <section key={g.title}>
            <h4>{g.title}</h4>
            {g.items.length ? (
              <ul>
                {g.items.map((i, n) => (
                  <li key={n}>
                    {i.text}{' '}
                    <Button type="link" onClick={() => visit(i.step)}>
                      {i.step}. adımdaki kaynağı aç
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Bu başlık için henüz kayıt yok.</p>
            )}
            {!g.items.length &&
              g.steps.map((s) => (
                <Button key={s} type="link" onClick={() => visit(s)}>
                  {s}. adımdaki kaynağı aç
                </Button>
              ))}
          </section>
        ))}
      </div>
      <details>
        <summary>Dört çapraz soruyu inceleyin</summary>
        <ol>
          {crossQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
      </details>
    </section>
  )
}
