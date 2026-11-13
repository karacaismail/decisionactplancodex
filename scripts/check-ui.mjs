import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import postcss from 'postcss'

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
  )
}
const problems = []
for (const file of files('src')) {
  const body = readFileSync(file, 'utf8')
  if (file.endsWith('.css')) {
    const root = postcss.parse(body, { from: file })
    root.walkDecls((d) => {
      let context = d.parent
      while (
        context &&
        !(
          context.type === 'atrule' &&
          context.name === 'media' &&
          context.params.includes('prefers-reduced-motion')
        )
      )
        context = context.parent
      if (context) return
      if (
        /^(transition|animation)(-|$)/.test(d.prop) &&
        !d.value.includes('var(--')
      )
        problems.push(
          file +
            ':' +
            d.source.start.line +
            ' Hareket ortak değerleri kullanmalıdır.',
        )
      if (/^(transition|animation)$/.test(d.prop) && /\ball\b/.test(d.value))
        problems.push(file + ': Tüm özellikleri birden hareketlendirmeyin.')
      if (
        d.prop === 'font-size' &&
        /^([\d.]+)px$/.test(d.value) &&
        parseFloat(d.value) < 14
      )
        problems.push(file + ': Metin en az 14 piksel olmalıdır.')
    })
  }
  if (
    file.endsWith('.tsx') &&
    /\b(?:transitionDuration|animationDuration|transitionTimingFunction)\s*:/.test(
      body,
    )
  )
    problems.push(
      file + ': Bileşen içi hareket değeri yerine ortak ayarı kullanın.',
    )
}
if (problems.length) {
  console.error(problems.join('\n'))
  process.exitCode = 1
} else console.log('Ortak hareket ve metin kuralları denetlendi.')
