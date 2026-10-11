const base = 'http://[::1]:3000'
const page = await fetch(base + '/csharp/csharp%E7%9A%84%E5%A4%9A%E7%BA%BF%E7%A8%8B')
const text = await page.text()
const out = []
let idx = -1
let n = 0
while ((idx = text.indexOf('language-mermaid', idx + 1)) !== -1 && n < 3) {
  out.push(`--- occurrence ${++n} ---`)
  out.push(text.slice(Math.max(0, idx - 250), idx + 250).replace(/\n/g, '\\n'))
}
out.push(`total occurrences: ${(text.match(/language-mermaid/g) || []).length}`)
await (
  await import('node:fs/promises')
).writeFile(new URL('./_snippet.txt', import.meta.url), out.join('\n'), 'utf8')
