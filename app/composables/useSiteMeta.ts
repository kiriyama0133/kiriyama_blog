/**
 * 全站 meta 的唯一出处 —— 改站点名 / 站点描述只改 i18n 的 `site.*` 文案。
 *
 * 为啥是 composable 而不是 utils：文案要跟着语言变，必须能拿到 `useI18n()`，
 * 而 `useI18n()` 只能在 setup / composable 里调用。
 */
export function useSiteMeta() {
  const { t } = useI18n()

  /** 站点名：浏览器标签页里「笔记标题 · Blog」的尾巴 */
  const siteName = computed(() => t('site.name'))

  /** 站点描述：首页以及没有自己描述时的兜底 */
  const siteDescription = computed(() => t('site.description'))

  /**
   * 统一拼「标题 · 站点名」。
   * 没有标题时只返回站点名，避免拼出「· Blog」这种半截标题。
   */
  function pageTitle(title?: string | null): string {
    const value = title?.trim()
    return value ? `${value} · ${siteName.value}` : siteName.value
  }

  return { siteName, siteDescription, pageTitle }
}
