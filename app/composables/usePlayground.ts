import { storeToRefs } from 'pinia'
import {
  RUNNABLE_LANG_MAP,
  usePlaygroundStore,
  type PlaygroundLanguage,
  type PlaygroundOpenOptions,
  type WebFiles,
  type WebTab
} from '~/stores/playground'

export type { PlaygroundLanguage, PlaygroundOpenOptions, WebFiles, WebTab }

/**
 * 判断代码块语言是否支持进入 Playground（仅拦截 html / ts / js / csharp / c / cpp）
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
 * 基于 Pinia Store (stores/playground.ts) 的组合式封装
 */
export function usePlayground() {
  const store = usePlaygroundStore()
  const {
    isOpen,
    code,
    initialCode,
    language,
    originLanguage,
    filename,
    langCodeMap,
    activeWebTab,
    webFiles,
    initialWebFiles,
    isWebMode
  } = storeToRefs(store)

  return {
    isOpen,
    code,
    initialCode,
    language,
    originLanguage,
    filename,
    langCodeMap,
    activeWebTab,
    webFiles,
    initialWebFiles,
    isWebMode,
    openPlayground: store.openPlayground,
    setWebTab: store.setWebTab,
    resetCode: store.resetCode,
    closePlayground: store.closePlayground
  }
}
