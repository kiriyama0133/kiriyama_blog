/**
 * 全站 meta 的唯一出处 —— 改站点名 / 站点描述只改这里。
 */

/** 站点名：浏览器标签页里「笔记标题 · Blog」的尾巴 */
export const SITE_NAME = 'Blog'

/** 站点描述：首页以及没有自己描述时的兜底 */
export const SITE_DESCRIPTION = '个人前端笔记 —— Vue / Nuxt / 工程化'

/**
 * 统一拼「标题 · 站点名」。
 * 没有标题时只返回站点名，避免拼出「· Blog」这种半截标题。
 */
export function pageTitle(title?: string | null): string {
  const t = title?.trim()
  return t ? `${t} · ${SITE_NAME}` : SITE_NAME
}
