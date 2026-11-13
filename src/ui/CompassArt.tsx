// An eight-point compass represents the eight decisions. The artwork has no external assets.
export default function CompassArt({ stage }: { stage: number }) {
  return (
    <svg
      aria-hidden="true"
      className="compass-art"
      viewBox="0 0 400 270"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="grid" width="23" height="23" patternUnits="userSpaceOnUse">
          <path d="M23 0H0V23" stroke="#a7c8ba" strokeOpacity=".10" />
        </pattern>
        <linearGradient id="sea" x2="1" y2=".4">
          <stop stopColor="#203a40" />
          <stop offset="1" stopColor="#28464a" />
        </linearGradient>
      </defs>
      <rect width="400" height="270" fill="url(#sea)" />
      <rect width="400" height="270" fill="url(#grid)" />
      <g stroke="#a5c3af" opacity=".22">
        {Array.from({ length: 12 }, (_, i) => (
          <path
            key={i}
            d={
              'M' +
              (-85 + i * 9) +
              ' 292 C 10 235, 103 ' +
              (325 - i * 4) +
              ', 149 ' +
              (221 - i * 6) +
              ' S 198 ' +
              (155 - i * 5) +
              ', 281 ' +
              (171 - i * 7) +
              ' S 373 ' +
              (100 - i * 5) +
              ', 432 ' +
              (128 - i * 8)
            }
          />
        ))}
      </g>
      <g transform="translate(226 140)">
        <circle
          r="115"
          stroke="#afc7ba"
          strokeOpacity=".26"
          strokeDasharray="2 7"
        />
        <circle r="99" stroke="#adbcac" strokeOpacity=".56" />
        <circle r="79" stroke="#bec9b0" strokeOpacity=".3" />
        <circle r="55" stroke="#b7c2aa" strokeOpacity=".2" />
        {Array.from({ length: 60 }, (_, i) => (
          <path
            key={i}
            d={'M0 -99v' + (i % 5 === 0 ? '9' : '3')}
            stroke={i % 5 === 0 ? '#eab98b' : '#7c9691'}
            transform={'rotate(' + i * 6 + ')'}
          />
        ))}
        <g stroke="#c7c8b1" opacity=".43">
          <path d="M-129 0h258M0 -125v250" strokeDasharray="4 7" />
          <path d="m-52 -52 104 104m-104 0 104 -104" strokeDasharray="2 5" />
        </g>
        <g transform={'rotate(' + (-54 + stage * 15) + ')'}>
          <path d="M0-85 15-13 0 0Z" fill="#f1a15f" />
          <path d="M0-85-14-12 0 0Z" fill="#ffe0b4" />
          <path d="M0 76-14 12 0 0Z" fill="#739a93" />
          <path d="M0 76 14 12 0 0Z" fill="#bed1c3" />
          <path d="m-58 0 46-10L0 0z" fill="#799f97" />
          <path d="m-58 0 45 10L0 0z" fill="#547673" />
          <path d="M60 0 12 10 0 0Z" fill="#99b5a9" />
          <path d="M60 0 12-10 0 0Z" fill="#527571" />
        </g>
        <circle r="6" fill="#20383c" stroke="#f1c99c" strokeWidth="2" />
      </g>
    </svg>
  )
}
