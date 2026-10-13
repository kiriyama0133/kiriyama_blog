import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const TARGET_URL = process.argv[2] ?? 'http://[::1]:3000/'

const logs = []
let ws
let child

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = send.seq++
    const onMessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.id !== id) return
      ws.removeEventListener('message', onMessage)
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`))
      else resolve(msg.result)
    }
    ws.addEventListener('message', onMessage)
    ws.send(JSON.stringify({ id, method, params }))
    setTimeout(() => reject(new Error(`${method} timeout`)), 120000)
  })
}
send.seq = 1

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify((() => { ${expression} })())`,
    returnByValue: true,
    awaitPromise: true
  })
  const raw = res?.result?.value
  if (raw == null) return null
  return JSON.parse(raw)
}

const snapshotExpr = `
  const q = (s) => document.querySelector(s)
  return {
    readyState: document.readyState,
    moduleScripts: document.querySelectorAll('script[type="module"]').length,
    jsResources: performance.getEntriesByType('resource').filter(r => r.name.includes('.js') || r.name.includes('.ts')).length,
    hasNuxtPayload: !!window.__NUXT__,
    hasNuxtApp: !!window.useNuxtApp,
    htmlLang: document.documentElement.lang,
    title: document.title,
    typeLabel: q('.dropdown .label')?.textContent?.trim() ?? null,
    searchPlaceholder: q('.search_input')?.getAttribute('placeholder') ?? null,
    chartBtn: q('.chart-btn__label')?.textContent?.trim() ?? null,
    filterMeta: q('.filter-meta')?.textContent?.replace(/\\s+/g, ' ').trim() ?? null,
    backToTop: q('.back-to-top__label')?.textContent?.trim() ?? null,
    langBtn: q('.lang-btn__text')?.textContent?.trim() ?? null,
    themeBtn: !!q('.theme-toggle__btn'),
    themeRow: q('.theme-toggle')?.outerHTML?.slice(0, 300) ?? null,
    cookie: document.cookie
  }
`

async function main() {
  child = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=E:\\kiriyama_blog\\.workbuddy\\_chrome-profile-${Date.now()}`,
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--lang=zh-CN',
      '--accept-lang=zh-CN,zh',
      '--window-size=1280,900',
      'about:blank'
    ],
    { stdio: 'ignore' }
  )

  let target = null
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) {
        target = page
        break
      }
    } catch {
      /* 等 chrome 起来 */
    }
    await sleep(500)
  }
  if (!target) throw new Error('无法连接 Chrome CDP')

  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    const p = msg.params ?? {}
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = (p.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(' ')
      logs.push(`[console.${p.type}] ${text}`)
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = p.exceptionDetails ?? {}
      logs.push(`[exception] ${d.text} ${d.exception?.description ?? ''}`)
    }
    if (msg.method === 'Log.entryAdded') {
      const e = p.entry ?? {}
      logs.push(`[log.${e.level}] ${e.source} ${e.text}${e.url ? ` @ ${e.url}` : ''}`)
    }
    if (msg.method === 'Network.loadingFailed') {
      logs.push(`[netfail] ${p.type} ${p.errorText} blocked=${p.blockedReason ?? ''}`)
    }
    if (msg.method === 'Network.responseReceived') {
      const r = p.response ?? {}
      if (r.status >= 400) logs.push(`[http ${r.status}] ${r.url}`)
    }
  })

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: TARGET_URL })

  // dev server 是首次按需编译客户端模块，可能要好几十秒才挂载；一直等到 ClientOnly 里的按钮出现
  let mounted = false
  for (let i = 0; i < 75; i += 1) {
    await sleep(2000)
    mounted = await evaluate(`return !!document.querySelector('.theme-toggle__btn')`)
    if (mounted) break
  }
  console.log(`挂载等待: ${mounted ? '已挂载' : '超时未挂载'}`)

  const before = await evaluate(snapshotExpr)
  console.log('URL:', TARGET_URL)
  console.log('\n=== 首次加载（zh-CN）===')
  console.log(JSON.stringify(before, null, 2))

  if (before?.themeBtn) {
    await evaluate(`document.querySelector('.lang-btn').click(); return true`)
    await sleep(1500)
    const after = await evaluate(snapshotExpr)
    console.log('\n=== 点语言按钮后 ===')
    console.log(JSON.stringify(after, null, 2))
    await evaluate(`document.querySelector('.lang-btn').click(); return true`)
    await sleep(1500)
    console.log('\n=== 再点一次 ===')
    console.log(JSON.stringify(await evaluate(snapshotExpr), null, 2))
  } else {
    console.log('\n!! 语言按钮不在 DOM 里，跳过切换测试')
  }

  console.log('\n=== 浏览器侧日志（全部）===')
  console.log(logs.length ? logs.slice(0, 60).join('\n') : '(无任何日志)')
}

try {
  await main()
} catch (error) {
  console.error('脚本出错:', error)
  process.exitCode = 2
} finally {
  try {
    child?.kill()
  } catch {
    /* ignore */
  }
  await sleep(300)
  process.exit(process.exitCode ?? 0)
}
