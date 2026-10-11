// 验证 dev server：首页 → 拿一个真实链接 → 检查 shiki 高亮与 mermaid 占位
const base = 'http://[::1]:3000'
const out = []

const home = await fetch(base + '/')
const homeText = await home.text()
out.push(`HOME ${home.status} len=${homeText.length}`)

const links = [...homeText.matchAll(/href="([^"]*\/csharp\/[^"]*)"/g)].map((m) => m[1])
out.push(`CSHARP_LINKS=${links.length} first=${links[0]}`)

const target = links.find((l) => decodeURIComponent(l).includes('多线程')) || links[0]
if (target) {
  const page = await fetch(base + target)
  const text = await page.text()
  out.push(`PAGE ${page.status} ${decodeURIComponent(target)} len=${text.length}`)
  out.push(`SHIKI_SPAN=${/<span style="--shiki/.test(text)}`)
  out.push(`SHIKI_DARK_VAR=${text.includes('--shiki-dark')}`)
  out.push(`MERMAID_DIV=${text.includes('class="mermaid"')}`)
  out.push(`PRE_CLASS_SHIKI=${/class="[^"]*shiki/.test(text)}`)
} else {
  out.push('NO_TARGET')
}

// 顺带抓一篇有 c++ 代码块的
const cppLink = [...homeText.matchAll(/href="([^"]*\/cpp\/[^"]*)"/g)].map((m) => m[1])[0]
if (cppLink) {
  const page = await fetch(base + cppLink)
  const text = await page.text()
  out.push(`CPP PAGE ${page.status} ${decodeURIComponent(cppLink)}`)
  out.push(`CPP_SHIKI_SPAN=${/<span style="--shiki/.test(text)}`)
}

await (
  await import('node:fs/promises')
).writeFile(new URL('./_verify.txt', import.meta.url), out.join('\n'), 'utf8')
