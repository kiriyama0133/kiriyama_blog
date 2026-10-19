import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type PlaygroundLanguage = 'html' | 'typescript' | 'javascript' | 'csharp' | 'c' | 'cpp'
export type WebTab = 'html' | 'css' | 'javascript'

export interface WebFiles {
  html: string
  css: string
  javascript: string
}

export interface PlaygroundOpenOptions {
  code: string
  language?: string
  filename?: string
}

export const RUNNABLE_LANG_MAP: Record<string, PlaygroundLanguage> = {
  html: 'html',
  htm: 'html',
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  cs: 'csharp',
  csharp: 'csharp',
  'c#': 'csharp',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp'
}

export const DEFAULT_WEB_FILES: WebFiles = {
  html: [
    '<div class="demo-card">',
    '  <div class="demo-badge">HTML + CSS + JS</div>',
    '  <h2 class="demo-title">Interactive Style Playground</h2>',
    '  <p class="demo-desc">尝试切换上方 CSS / JS 标签页修改样式或交互逻辑，右侧预览会实时响应。</p>',
    '  <button id="counter-btn" class="demo-btn" type="button">',
    '    Clicked <span id="count">0</span> times',
    '  </button>',
    '</div>'
  ].join('\n'),
  css: [
    '.demo-card {',
    '  max-width: 360px;',
    '  margin: 24px auto;',
    '  padding: 24px;',
    '  border-radius: 16px;',
    '  background: linear-gradient(145deg, #ffffff, #f4f4f8);',
    '  border: 1px solid #e4e4ec;',
    '  box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.08);',
    '  font-family: system-ui, -apple-system, sans-serif;',
    '  color: #1f1f29;',
    '}',
    '',
    '.demo-badge {',
    '  display: inline-block;',
    '  padding: 3px 10px;',
    '  border-radius: 999px;',
    '  font-size: 12px;',
    '  font-weight: 600;',
    '  background: #eef2ff;',
    '  color: #4f46e5;',
    '  margin-bottom: 12px;',
    '}',
    '',
    '.demo-title {',
    '  margin: 0 0 8px;',
    '  font-size: 18px;',
    '  font-weight: 700;',
    '}',
    '',
    '.demo-desc {',
    '  margin: 0 0 18px;',
    '  font-size: 13.5px;',
    '  line-height: 1.6;',
    '  color: #52525b;',
    '}',
    '',
    '.demo-btn {',
    '  padding: 8px 16px;',
    '  border-radius: 10px;',
    '  border: none;',
    '  background: #4f46e5;',
    '  color: #ffffff;',
    '  font-size: 13.5px;',
    '  font-weight: 600;',
    '  cursor: pointer;',
    '  transition: transform 0.15s ease, background 0.15s ease;',
    '}',
    '',
    '.demo-btn:hover {',
    '  background: #4338ca;',
    '  transform: translateY(-1px);',
    '}',
    '',
    '.demo-btn:active {',
    '  transform: translateY(0);',
    '}'
  ].join('\n'),
  javascript: [
    'let count = 0;',
    'const btn = document.getElementById("counter-btn");',
    'const span = document.getElementById("count");',
    '',
    'btn?.addEventListener("click", () => {',
    '  count += 1;',
    '  if (span) span.textContent = String(count);',
    '  console.log("Button clicked:", count);',
    '});'
  ].join('\n')
}

export const DEFAULT_LANGUAGE_SNIPPETS: Record<Exclude<PlaygroundLanguage, 'html'>, string> = {
  typescript: [
    'const nums: number[] = [1, 2, 3, 4, 5]',
    'console.log("Squares:", nums.map(n => n * n))'
  ].join('\n'),
  javascript: [
    'const nums = [1, 2, 3, 4, 5]',
    'console.log("Squares:", nums.map(n => n * n))'
  ].join('\n'),
  csharp: [
    'var nums = Enumerable.Range(1, 5).Select(x => x * x);',
    'Console.WriteLine("Hello from .NET WASM! " + string.Join(", ", nums));'
  ].join('\n'),
  c: [
    '#include <stdio.h>',
    '',
    'int main(void) {',
    '  int nums[] = {1, 2, 3, 4, 5};',
    '  printf("Hello from Clang 22 (C23 WASM)! Squares: ");',
    '  for (int i = 0; i < 5; ++i) {',
    '    printf("%d ", nums[i] * nums[i]);',
    '  }',
    '  printf("\\n");',
    '  return 0;',
    '}'
  ].join('\n'),
  cpp: [
    '#include <iostream>',
    '#include <vector>',
    '',
    'int main() {',
    '  std::vector<int> nums = {1, 2, 3, 4, 5};',
    '  std::cout << "Hello from Clang 22 (C++23 WASM)! Squares: ";',
    '  for (int n : nums) {',
    '    std::cout << n * n << " ";',
    '  }',
    '  std::cout << std::endl;',
    '  return 0;',
    '}'
  ].join('\n')
}

/**
 * 将文章中的 ```html 代码块智能拆分为 { html, css, javascript } 三个 Tab：
 * - 自动提取所有 <style>...</style> 到 CSS Tab
 * - 自动提取所有内联 <script>...</script>（不含外链 src）到 JS Tab
 * - 如果包含 <body>...</body> 则提取 body 内部结构到 HTML Tab
 */
export function parseHtmlIntoWebFiles(rawHtml: string): WebFiles {
  const cssParts: string[] = []
  const jsParts: string[] = []

  let working = rawHtml.replace(/\r\n/g, '\n')

  // 提取 <style>...</style>
  working = working.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, content: string) => {
    const trimmed = content.trim()
    if (trimmed) cssParts.push(trimmed)
    return ''
  })

  // 提取内联 <script>...</script>（保留带 src 属性的外部脚本标签）
  working = working.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (fullMatch, attrs: string, content: string) => {
      if (/\bsrc\s*=/i.test(attrs)) {
        return fullMatch
      }
      const trimmed = content.trim()
      if (trimmed) jsParts.push(trimmed)
      return ''
    }
  )

  // 如果是完整 HTML 文档，提取 <body> 内部内容（同时保留 head 中的外链 <link> / <script src>）
  const externalLinks: string[] = []
  const headMatch = working.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
  if (headMatch && headMatch[1]) {
    const linkMatches = headMatch[1].match(
      /<(?:link\b[^>]*|script\b[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script)>/gi
    )
    if (linkMatches) {
      externalLinks.push(...linkMatches)
    }
  }

  const bodyMatch = working.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch && bodyMatch[1] !== undefined) {
    working = [...externalLinks, bodyMatch[1].trim()].filter(Boolean).join('\n')
  } else {
    // 去掉多余的 <!DOCTYPE> / <html> / <head> 外壳
    working = working
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?(?:html|head|body)\b[^>]*>/gi, '')
      .replace(/<meta\b[^>]*>/gi, '')
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .trim()
  }

  return {
    html: working || '<!-- 在此编写 HTML 结构 -->\n<div></div>',
    css: cssParts.join('\n\n'),
    javascript: jsParts.join('\n\n')
  }
}

export const usePlaygroundStore = defineStore('playground', () => {
  const isOpen = ref(false)
  const language = ref<PlaygroundLanguage>('typescript')
  const originLanguage = ref<PlaygroundLanguage>('typescript')
  const filename = ref('')

  // 普通单文件语言状态（TS / JS / C# / C / C++）
  const code = ref(DEFAULT_LANGUAGE_SNIPPETS.typescript)
  const initialCode = ref(DEFAULT_LANGUAGE_SNIPPETS.typescript)
  const langCodeMap = ref<Record<Exclude<PlaygroundLanguage, 'html'>, string>>({
    typescript: DEFAULT_LANGUAGE_SNIPPETS.typescript,
    javascript: DEFAULT_LANGUAGE_SNIPPETS.javascript,
    csharp: DEFAULT_LANGUAGE_SNIPPETS.csharp,
    c: DEFAULT_LANGUAGE_SNIPPETS.c,
    cpp: DEFAULT_LANGUAGE_SNIPPETS.cpp
  })

  // Web 前端演练场三合一 Tab 状态（HTML + CSS + JS）
  const activeWebTab = ref<WebTab>('html')
  const webFiles = ref<WebFiles>({ ...DEFAULT_WEB_FILES })
  const initialWebFiles = ref<WebFiles>({ ...DEFAULT_WEB_FILES })

  const isWebMode = computed(() => language.value === 'html')

  function normalizeLanguage(lang?: string): PlaygroundLanguage {
    if (!lang) return 'typescript'
    return RUNNABLE_LANG_MAP[lang.toLowerCase().trim()] ?? 'typescript'
  }

  function openPlayground(options: PlaygroundOpenOptions) {
    const trimmed = options.code.replace(/\n$/, '')
    const targetLang = normalizeLanguage(options.language)

    language.value = targetLang
    originLanguage.value = targetLang
    filename.value = options.filename ?? ''

    // 重置其他语言的默认缓存
    langCodeMap.value = {
      typescript: DEFAULT_LANGUAGE_SNIPPETS.typescript,
      javascript: DEFAULT_LANGUAGE_SNIPPETS.javascript,
      csharp: DEFAULT_LANGUAGE_SNIPPETS.csharp,
      c: DEFAULT_LANGUAGE_SNIPPETS.c,
      cpp: DEFAULT_LANGUAGE_SNIPPETS.cpp
    }

    if (targetLang === 'html') {
      const parsed = parseHtmlIntoWebFiles(trimmed)
      webFiles.value = { ...parsed }
      initialWebFiles.value = { ...parsed }
      activeWebTab.value = 'html'
    } else {
      initialCode.value = trimmed
      code.value = trimmed
      langCodeMap.value[targetLang] = trimmed
      webFiles.value = { ...DEFAULT_WEB_FILES }
      initialWebFiles.value = { ...DEFAULT_WEB_FILES }
      activeWebTab.value = 'html'
    }

    isOpen.value = true
  }

  function setWebTab(tab: WebTab) {
    activeWebTab.value = tab
  }

  function resetCode() {
    if (language.value === 'html') {
      if (originLanguage.value === 'html') {
        webFiles.value = { ...initialWebFiles.value }
      } else {
        webFiles.value = { ...DEFAULT_WEB_FILES }
      }
      return
    }

    if (language.value === originLanguage.value) {
      code.value = initialCode.value
    } else {
      code.value = DEFAULT_LANGUAGE_SNIPPETS[language.value]
    }
    langCodeMap.value[language.value] = code.value
  }

  function closePlayground() {
    isOpen.value = false
  }

  return {
    isOpen,
    language,
    originLanguage,
    filename,
    code,
    initialCode,
    langCodeMap,
    activeWebTab,
    webFiles,
    initialWebFiles,
    isWebMode,
    openPlayground,
    setWebTab,
    resetCode,
    closePlayground
  }
})
