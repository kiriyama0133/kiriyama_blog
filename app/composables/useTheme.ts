import { computed } from 'vue'

export type ThemeName = 'light' | 'dark'

/** localStorage 键名 */
export const THEME_STORAGE_KEY = 'blog-theme'

/** @nuxt/content 的 shiki 双主题也认 */
export const DARK_CLASS = 'dark'

export function useTheme() {
  const theme = useState<ThemeName>('theme', () => 'light')

  if (import.meta.client) {
    theme.value = document.documentElement.classList.contains(DARK_CLASS) ? 'dark' : 'light'
  }

  const isDark = computed(() => theme.value === 'dark')

  function setTheme(next: ThemeName) {
    theme.value = next
    if (import.meta.server) return
    document.documentElement.classList.toggle(DARK_CLASS, next === 'dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch (error) {
      // 隐私模式 / 存储被禁用时写不进去：本次会话照样能切，只是记不住
      console.warn('[theme] 无法写入 localStorage', error)
    }
  }

  function toggle() {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  return { theme, isDark, setTheme, toggle }
}
