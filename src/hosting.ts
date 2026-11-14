// GitHub Pages serves files. The local Node server also serves team requests.
export const personalOnly = import.meta.env.MODE === 'pages'
export const storagePrefix = personalOnly ? 'decisionactplancodex:' : ''
