import type { PlaygroundLanguage } from '~/composables/usePlayground'

export interface ConsoleEntry {
  level: 'log' | 'info' | 'warn' | 'error'
  text: string
  timestamp: number
}

export interface CodeDiagnostic {
  id?: string
  message: string
  severity?: 'error' | 'warning' | 'info'
  line?: number
  column?: number
}

export type RunDiagnostic = CodeDiagnostic

export interface RunResult {
  entries: ConsoleEntry[]
  error?: string
  diagnostics?: CodeDiagnostic[]
  durationMs: number
}

interface ClangWasmRunOutput {
  stdout: string
  stderr: string
  output: string
  errors: string[]
  exitCode: number | null
  compileMs?: number
  runMs?: number | null
}

interface ClangWasmCompiler {
  run: (
    code: string,
    input?: string,
    options?: {
      std?: string | null
      args?: string[]
      compileArgs?: string[]
      fileName?: string
    }
  ) => Promise<ClangWasmRunOutput>
  dispose: () => void
}

interface ClangWasmModule {
  createCompiler: (
    language: 'c' | 'cpp',
    options: {
      baseUrl: string
      std?: string | null
      compileArgs?: string[]
      onProgress?: (progress: number) => void
    }
  ) => Promise<ClangWasmCompiler>
}

const CLANG_WASM_ESM_URL = 'https://cdn.jsdelivr.net/npm/@live-codes/clang-wasm@0.3.0/+esm'
const CLANG_WASM_ASSETS_URL = 'https://cdn.jsdelivr.net/npm/@live-codes/clang-wasm@0.3.0/assets/'

const clangCompilerPromises: Partial<Record<'c' | 'cpp', Promise<ClangWasmCompiler>>> = {}

/**
 * 从 jsDelivr CDN 按需加载 @live-codes/clang-wasm (Clang 22 + LLD + WASI sysroot)
 * C 与 C++ 共享同一份底层 WebAssembly 运行时资产
 */
export async function ensureClangCompiler(lang: 'c' | 'cpp'): Promise<ClangWasmCompiler> {
  if (clangCompilerPromises[lang]) {
    return clangCompilerPromises[lang]!
  }

  clangCompilerPromises[lang] = (async () => {
    try {
      const mod = (await import(/* @vite-ignore */ CLANG_WASM_ESM_URL)) as ClangWasmModule
      return await mod.createCompiler(lang, {
        baseUrl: CLANG_WASM_ASSETS_URL,
        std: lang === 'c' ? 'gnu23' : 'gnu++23'
      })
    } catch (err) {
      clangCompilerPromises[lang] = undefined
      throw err
    }
  })()

  return clangCompilerPromises[lang]!
}

const C_IMPLICIT_HEADERS = [
  '#include <stdio.h>',
  '#include <stdlib.h>',
  '#include <string.h>',
  '#include <stdbool.h>',
  '#include <stdint.h>',
  '#include <math.h>'
].join('\n')

const CPP_IMPLICIT_HEADERS = [
  '#include <iostream>',
  '#include <vector>',
  '#include <string>',
  '#include <algorithm>',
  '#include <map>',
  '#include <unordered_map>',
  '#include <set>',
  '#include <memory>',
  '#include <numeric>',
  '#include <cmath>',
  '#include <cstdio>'
].join('\n')

function prepareClangSource(lang: 'c' | 'cpp', code: string): string {
  const fileName = lang === 'c' ? 'main.c' : 'main.cpp'
  const headers = lang === 'c' ? C_IMPLICIT_HEADERS : CPP_IMPLICIT_HEADERS
  const hasMain = /\bmain\s*\(/.test(code)

  if (hasMain) {
    return `${headers}\n#line 1 "${fileName}"\n${code}`
  }

  // 如果文章中的代码块只是几行演示片段（不含 main 函数），自动为其包裹 main 入口并保持真实行号
  if (lang === 'c') {
    return [headers, 'int main(void) {', `#line 1 "${fileName}"`, code, 'return 0;', '}'].join('\n')
  }

  return [
    headers,
    'using namespace std;',
    'int main() {',
    `#line 1 "${fileName}"`,
    code,
    'return 0;',
    '}'
  ].join('\n')
}

function parseClangDiagnostics(errorLines: string[]): CodeDiagnostic[] {
  const diagnostics: CodeDiagnostic[] = []
  // 匹配例如: main.cpp:5:12: error: expected ';' after expression
  const diagRegex = /^(?:.*?):(\d+):(\d+):\s*(fatal error|error|warning|note):\s*(.+)$/i

  for (const rawLine of errorLines) {
    const m = rawLine.match(diagRegex)
    if (m) {
      const line = Math.max(1, Number.parseInt(m[1] ?? '1', 10))
      const column = Math.max(1, Number.parseInt(m[2] ?? '1', 10))
      const rawSev = (m[3] ?? 'error').toLowerCase()
      const message = m[4] ?? rawLine
      if (rawSev === 'note') continue
      diagnostics.push({
        line,
        column,
        severity: rawSev === 'warning' ? 'warning' : 'error',
        message
      })
    }
  }
  return diagnostics
}

async function runClangInWasm(lang: 'c' | 'cpp', code: string): Promise<RunResult> {
  const start = performance.now()
  try {
    const compiler = await ensureClangCompiler(lang)
    const prepared = prepareClangSource(lang, code)
    const res = await compiler.run(prepared)

    const entries: ConsoleEntry[] = []
    const stdoutText = (res.stdout || res.output || '').replace(/\r\n/g, '\n').replace(/\n$/, '')
    if (stdoutText) {
      entries.push({
        level: 'log',
        text: stdoutText,
        timestamp: Date.now()
      })
    }

    const stderrText = (res.stderr || '').replace(/\r\n/g, '\n').replace(/\n$/, '')
    if (stderrText && res.exitCode === 0) {
      entries.push({
        level: 'warn',
        text: stderrText,
        timestamp: Date.now()
      })
    }

    const diagnostics = parseClangDiagnostics(res.errors ?? [])
    let errorText: string | undefined

    if (res.errors && res.errors.length > 0) {
      errorText = res.errors.join('\n')
    } else if (res.exitCode !== null && res.exitCode !== 0) {
      errorText = stderrText || `Program exited with non-zero code: ${res.exitCode}`
    }

    return {
      entries,
      error: errorText,
      diagnostics,
      durationMs: Math.round(performance.now() - start)
    }
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start)
    }
  }
}

interface BlazorWasmRunResult {
  success: boolean
  output?: string
  errors?: Array<{
    id?: string
    message: string
    severity?: string
    line?: number
    column?: number
  }>
}

interface BlazorWasmRunner {
  ready?: () => Promise<void>
  run: (source: string, stdin?: string) => Promise<BlazorWasmRunResult>
}

interface WindowWithBlazorRunner extends Window {
  BlazorRunner?: {
    create: (options?: {
      baseUrl?: string
      root?: string | Element
      onProgress?: (count: number) => void
    }) => BlazorWasmRunner
  }
}

const BLAZOR_WASM_CDN_BASE = 'https://cdn.jsdelivr.net/npm/@live-codes/blazor-wasm@0.1.1/'
const BLAZOR_WASM_SCRIPT_URL = `${BLAZOR_WASM_CDN_BASE}blazor-wasm.js`

let csharpRunnerPromise: Promise<BlazorWasmRunner> | null = null
let csharpBusy = false

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      reject(new Error(`Failed to load .NET WASM script from CDN: ${src}`))
    }
    document.head.appendChild(script)
  })
}

/**
 * 从 jsDelivr CDN 按需加载 @live-codes/blazor-wasm (.NET WebAssembly + Roslyn)
 */
export async function ensureCSharpRunner(): Promise<BlazorWasmRunner> {
  if (csharpRunnerPromise) return csharpRunnerPromise

  csharpRunnerPromise = (async () => {
    try {
      // BlazorRunner 启动时需要挂载一个隐藏宿主节点 #blazor-app
      if (!document.getElementById('blazor-app')) {
        const host = document.createElement('div')
        host.id = 'blazor-app'
        host.style.display = 'none'
        document.body.appendChild(host)
      }

      await loadScriptOnce(BLAZOR_WASM_SCRIPT_URL)

      const win = window as unknown as WindowWithBlazorRunner
      if (!win.BlazorRunner) {
        throw new Error('BlazorRunner not found on window after script load.')
      }

      const runner = win.BlazorRunner.create({
        baseUrl: BLAZOR_WASM_CDN_BASE
      })

      if (typeof runner.ready === 'function') {
        await runner.ready()
      }
      return runner
    } catch (err) {
      csharpRunnerPromise = null
      throw err
    }
  })()

  return csharpRunnerPromise
}

/**
 * 模拟 .NET SDK 的 <ImplicitUsings>enable</ImplicitUsings>：
 * C# 10+ 的 global using 位于文件最顶部时，无论用户写的是顶层语句还是带 using/namespace/class 的完整代码均合法；
 * 配合 #line 1 指令，Roslyn 编译器返回的报错行号直接 1:1 对应编辑器真实行号。
 */
const CSHARP_IMPLICIT_USINGS = [
  'global using System;',
  'global using System.Collections.Generic;',
  'global using System.IO;',
  'global using System.Linq;',
  'global using System.Text;',
  'global using System.Threading;',
  'global using System.Threading.Tasks;',
  '#line 1'
].join('\n')

function withImplicitUsings(code: string): string {
  return `${CSHARP_IMPLICIT_USINGS}\n${code}`
}

/**
 * 若代码仍缺少 Main 入口（CS5001），自动包裹标准入口重试
 */
function wrapCSharpSnippet(code: string): string {
  return [
    CSHARP_IMPLICIT_USINGS,
    'public class Program { public static async Task Main(string[] args) {',
    '#line 1',
    code,
    '} }'
  ].join('\n')
}

/**
 * 仅使用 Roslyn 编译检查语法与类型诊断（不实际执行用户代码），用于编辑器输入时的实时波浪线提示
 */
export async function validateCSharpCode(code: string): Promise<CodeDiagnostic[]> {
  if (!code.trim() || csharpBusy) return []
  try {
    const runner = await ensureCSharpRunner()
    if (csharpBusy) return []
    csharpBusy = true
    try {
      const hasMainOrClass = /\b(class|struct|interface|namespace)\s+\w+/.test(code)
      const checkSource = hasMainOrClass
        ? withImplicitUsings(code)
        : [CSHARP_IMPLICIT_USINGS, 'if (bool.Parse("true")) return;', '#line 1', code].join('\n')

      // 如果有 class 但没有语句，仅当不含有效无限循环时做静态检查；
      // 顶层语句由于前面注入了 if (bool.Parse("true")) return; 会在 0ms 立即退出，绝对不会执行用户逻辑
      if (hasMainOrClass && !/\bstatic\b[\s\S]*?\bMain\s*\(/.test(code)) {
        const res = await runner.run(checkSource)
        return (res.errors ?? [])
          .filter((e) => e.id !== 'CS5001')
          .map((err) => ({
            id: err.id,
            message: err.message,
            severity: err.severity?.toLowerCase() === 'warning' ? 'warning' : 'error',
            line: err.line ? Math.max(1, err.line) : 1,
            column: err.column ?? 1
          }))
      }

      if (!hasMainOrClass) {
        const res = await runner.run(checkSource)
        return (res.errors ?? []).map((err) => ({
          id: err.id,
          message: err.message,
          severity: err.severity?.toLowerCase() === 'warning' ? 'warning' : 'error',
          line: err.line ? Math.max(1, err.line) : 1,
          column: err.column ?? 1
        }))
      }
      return []
    } finally {
      csharpBusy = false
    }
  } catch {
    return []
  }
}

async function runCSharpInWasm(code: string): Promise<RunResult> {
  const start = performance.now()
  try {
    const runner = await ensureCSharpRunner()
    csharpBusy = true
    let res: BlazorWasmRunResult
    try {
      res = await runner.run(withImplicitUsings(code))

      // 如果报缺少 Main 入口（CS5001），自动包装后再编译执行
      const missingMain = res.errors?.some(
        (e) => e.id === 'CS5001' || e.message?.includes('suitable for an entry point')
      )
      if (!res.success && missingMain && !/\bstatic\b[\s\S]*?\bMain\s*\(/.test(code)) {
        res = await runner.run(wrapCSharpSnippet(code))
      }
    } finally {
      csharpBusy = false
    }

    const entries: ConsoleEntry[] = []
    if (res.output) {
      const cleaned = res.output.replace(/\r\n/g, '\n').replace(/\n$/, '')
      if (cleaned) {
        entries.push({
          level: 'log',
          text: cleaned,
          timestamp: Date.now()
        })
      }
    }

    const diagnostics: CodeDiagnostic[] = (res.errors ?? []).map((err) => ({
      id: err.id,
      message: err.message,
      severity: err.severity?.toLowerCase() === 'warning' ? 'warning' : 'error',
      line: err.line ? Math.max(1, err.line) : 1,
      column: err.column ?? 1
    }))

    let errorText: string | undefined
    if (!res.success && diagnostics.length) {
      errorText = diagnostics
        .map((d) => {
          const loc = d.line ? `(${d.line},${d.column ?? 1}) ` : ''
          const codeId = d.id ? `${d.id}: ` : ''
          return `${loc}${codeId}${d.message}`
        })
        .join('\n')
    } else if (!res.success) {
      errorText = 'C# compilation or execution failed.'
    }

    return {
      entries,
      error: errorText,
      diagnostics,
      durationMs: Math.round(performance.now() - start)
    }
  } catch (err) {
    return {
      entries: [],
      error: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - start)
    }
  }
}

/**
 * 将 TS 源码转译为纯 JS（按需动态加载 sucrase）
 */
async function transpileTypeScript(code: string): Promise<string> {
  const { transform } = await import('sucrase')
  const result = transform(code, {
    transforms: ['typescript'],
    disableESTransforms: true
  })
  return result.code
}

/**
 * 在隔离的 Web Worker 中执行 JS 代码，拦截 console 输出并防止死循环卡死主线程
 */
function executeJsInWorker(jsCode: string, timeoutMs = 5000): Promise<RunResult> {
  return new Promise((resolve) => {
    const startTime = performance.now()
    const entries: ConsoleEntry[] = []

    const workerSource = `
      const formatValue = (val, seen = new WeakSet()) => {
        if (val === undefined) return 'undefined';
        if (val === null) return 'null';
        if (typeof val === 'string') return val;
        if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') return String(val);
        if (typeof val === 'symbol') return val.toString();
        if (typeof val === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';
        if (val instanceof Error) return val.stack || (val.name + ': ' + val.message);
        if (typeof val === 'object') {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
          try {
            return JSON.stringify(val, (k, v) => {
              if (typeof v === 'bigint') return v.toString() + 'n';
              if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
              if (v === undefined) return 'undefined';
              return v;
            }, 2);
          } catch {
            return Object.prototype.toString.call(val);
          }
        }
        return String(val);
      };

      const sendLog = (level, args) => {
        const text = args.map((a) => formatValue(a)).join(' ');
        self.postMessage({ type: 'log', level, text, timestamp: Date.now() });
      };

      self.console = {
        ...self.console,
        log: (...args) => sendLog('log', args),
        info: (...args) => sendLog('info', args),
        warn: (...args) => sendLog('warn', args),
        error: (...args) => sendLog('error', args),
        dir: (item) => sendLog('log', [item]),
        table: (data) => sendLog('log', [data])
      };

      self.onmessage = async (e) => {
        const code = e.data;
        try {
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const fn = new AsyncFunction(code);
          const returnVal = await fn();
          if (returnVal !== undefined) {
            sendLog('log', [returnVal]);
          }
          self.postMessage({ type: 'done' });
        } catch (err) {
          const message = err instanceof Error ? (err.stack || err.message) : String(err);
          self.postMessage({ type: 'error', error: message });
        }
      };
    `

    const blob = new Blob([workerSource], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)

    const cleanup = () => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve({
        entries,
        error: `Execution timed out after ${timeoutMs}ms (possible infinite loop).`,
        durationMs: Math.round(performance.now() - startTime)
      })
    }, timeoutMs)

    worker.onmessage = (event) => {
      const data = event.data
      if (data.type === 'log') {
        entries.push({
          level: data.level,
          text: data.text,
          timestamp: data.timestamp
        })
      } else if (data.type === 'done') {
        cleanup()
        resolve({
          entries,
          durationMs: Math.round(performance.now() - startTime)
        })
      } else if (data.type === 'error') {
        cleanup()
        resolve({
          entries,
          error: data.error,
          durationMs: Math.round(performance.now() - startTime)
        })
      }
    }

    worker.onerror = (err) => {
      cleanup()
      resolve({
        entries,
        error: err.message || 'Worker execution error',
        durationMs: Math.round(performance.now() - startTime)
      })
    }

    worker.postMessage(jsCode)
  })
}

/**
 * 按语言动态加载对应运行时并执行代码
 */
export async function runPlaygroundCode(
  language: PlaygroundLanguage,
  code: string
): Promise<RunResult> {
  const start = performance.now()
  if (!code.trim()) {
    return { entries: [], durationMs: 0 }
  }

  if (language === 'typescript') {
    try {
      const jsCode = await transpileTypeScript(code)
      return await executeJsInWorker(jsCode)
    } catch (err) {
      return {
        entries: [],
        error: err instanceof Error ? err.message : String(err),
        durationMs: Math.round(performance.now() - start)
      }
    }
  }

  if (language === 'javascript') {
    return await executeJsInWorker(code)
  }

  if (language === 'csharp') {
    return await runCSharpInWasm(code)
  }

  if (language === 'c' || language === 'cpp') {
    return await runClangInWasm(language, code)
  }

  return {
    entries: [],
    error: `Unsupported language: ${language}`,
    durationMs: 0
  }
}
