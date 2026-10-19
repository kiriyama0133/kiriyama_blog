export type PlaygroundLanguage = 'typescript' | 'javascript' | 'csharp'

export interface PlaygroundOpenOptions {
  code: string
  language?: string
  filename?: string
}

const RUNNABLE_LANG_MAP: Record<string, PlaygroundLanguage> = {
  ts: 'typescript',
  typescript: 'typescript',
  js: 'javascript',
  javascript: 'javascript',
  cs: 'csharp',
  csharp: 'csharp',
  'c#': 'csharp'
}

/**
 * 判断代码块语言是否支持进入 Playground
 */
export function isRunnableLanguage(lang?: string): boolean {
  if (!lang) return false
  return Boolean(RUNNABLE_LANG_MAP[lang.toLowerCase().trim()])
}

export function normalizePlaygroundLanguage(lang?: string): PlaygroundLanguage {
  if (!lang) return 'typescript'
  return RUNNABLE_LANG_MAP[lang.toLowerCase().trim()] ?? 'typescript'
}

/**
 * 全站共享的 Playground 弹窗状态（类似 useNotice，在 app.vue 挂载唯一实例）
 */
export function usePlayground() {
  const isOpen = useState<boolean>('playground-open', () => false)
  const code = useState<string>('playground-code', () => '')
  const initialCode = useState<string>('playground-initial-code', () => '')
  const language = useState<PlaygroundLanguage>('playground-lang', () => 'typescript')
  const filename = useState<string>('playground-filename', () => '')

  function openPlayground(options: PlaygroundOpenOptions) {
    const trimmed = options.code.replace(/\n$/, '')
    initialCode.value = trimmed
    code.value = trimmed
    language.value = normalizePlaygroundLanguage(options.language)
    filename.value = options.filename ?? ''
    isOpen.value = true
  }

  function resetCode() {
    code.value = initialCode.value
  }

  function closePlayground() {
    isOpen.value = false
  }

  return {
    isOpen,
    code,
    initialCode,
    language,
    filename,
    openPlayground,
    resetCode,
    closePlayground
  }
}
