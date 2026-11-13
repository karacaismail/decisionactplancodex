import small from '../assets/atlas-relief-small.webp'
import wide from '../assets/atlas-relief-wide.webp'
export default function Relief() {
  return (
    <picture className="atlas-relief" aria-hidden="true">
      <source
        media="(min-width: 48rem) and (min-height: 30rem)"
        srcSet={wide}
      />
      <img src={small} width="440" height="239" alt="" decoding="async" />
    </picture>
  )
}
