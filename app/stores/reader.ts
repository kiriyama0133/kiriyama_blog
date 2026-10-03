import { defineStore } from 'pinia'

/** `page.body.toc` 里的一条 —— nuxt/content 把 ## 解析成这个结构 */
export interface TocLink {
  id?: string
  text?: string
  depth?: number
  children?: TocLink[]
}

/** `page.body.toc` 本身 */
export interface TocTree {
  title?: string
  depth?: number
  searchDepth?: number
  links?: TocLink[]
}

/** 摊平后的一条锚点：扇形是单列，层级只用来控制缩进 */
export interface TocItem {
  id: string
  text: string
  depth: number
}

/**
 * 把 toc 摊平成一维。
 * 默认深度是 2（只有 ##），所以通常就是顶层平铺；
 * 但一旦以后把 toc.depth 调大（比如 3），嵌套层级也不会丢。
 */
export function flattenToc(toc?: TocTree | null): TocItem[] {
  const out: TocItem[] = []
  const walk = (links?: TocLink[]) => {
    for (const link of links ?? []) {
      if (!link?.id) continue
      out.push({ id: link.id, text: link.text || link.id, depth: link.depth ?? 2 })
      if (link.children?.length) walk(link.children)
    }
  }
  walk(toc?.links)
  return out
}

/**
 * 文档阅读状态。
 *
 * 为什么用 store 而不是 props：layout 与 page 是**兄弟关系**，
 * `[...slug].vue` 拿到 toc 之后要交给 `slug-layout.vue` 里的锚点导航用，
 * 中间没有父子链路可以传值，store 就是那条链路。
 *
 * 目前记录：当前文档(path/title) + 锚点列表(toc) + 当前锚点(activeId)。
 */
export const useReaderStore = defineStore('reader', () => {
  /** 当前文档路径 */
  const path = ref('')
  const title = ref('')
  /** 当前文档描述（分享 / 兜底 meta 用） */
  const description = ref('')
  /** 当前文档的全部锚点 */
  const toc = ref<TocItem[]>([])
  /** 当前锚点（点击跳转时更新；存的是 heading 的 id） */
  const activeId = ref('')

  const count = computed(() => toc.value.length)
  const hasToc = computed(() => toc.value.length > 0)

  /** 当前锚点在列表里的下标，找不到就是 -1 */
  const activeIndex = computed(() => toc.value.findIndex((item) => item.id === activeId.value))

  const activeItem = computed<TocItem | null>(() => toc.value[activeIndex.value] ?? null)

  /**
   * 装载一篇文章。直接吃 `page.body.toc`（也接受已摊平的数组）。
   * 默认把第一个锚点设为当前锚点。
   */
  function setArticle(payload: {
    path: string
    title?: string | null
    description?: string | null
    toc?: TocTree | TocItem[] | null
  }) {
    path.value = payload.path
    title.value = payload.title ?? ''
    description.value = payload.description ?? ''
    toc.value = Array.isArray(payload.toc) ? payload.toc : flattenToc(payload.toc)
    activeId.value = toc.value[0]?.id ?? ''
  }

  function setActiveId(id: string) {
    activeId.value = id
  }

  function setActiveIndex(index: number) {
    activeId.value = toc.value[index]?.id ?? ''
  }

  /**
   * 跳到某个锚点。
   * 只负责「滚动 + 记录」，扇形容器那边自己去把该条目转到前位。
   */
  function jumpTo(id: string, options: { behavior?: ScrollBehavior } = {}) {
    const { behavior = 'smooth' } = options
    if (!toc.value.some((item) => item.id === id)) return
    activeId.value = id
    if (import.meta.server) return
    const el = document.getElementById(id)
    if (!el) return
    // 顶部偏移由 CSS 的 scroll-margin-top 控制（见 main.scss）
    el.scrollIntoView({ behavior, block: 'start' })
  }

  function jumpToIndex(index: number, options?: { behavior?: ScrollBehavior }) {
    const item = toc.value[index]
    if (item) jumpTo(item.id, options)
  }

  /** 相对当前锚点前后移动（给键盘/按钮留的口子） */
  function jumpBy(delta: number, options?: { behavior?: ScrollBehavior }) {
    if (!toc.value.length) return
    const from = activeIndex.value < 0 ? 0 : activeIndex.value
    const next = Math.min(toc.value.length - 1, Math.max(0, from + delta))
    jumpToIndex(next, options)
  }

  function clear() {
    path.value = ''
    title.value = ''
    description.value = ''
    toc.value = []
    activeId.value = ''
  }

  return {
    path,
    title,
    description,
    toc,
    activeId,
    count,
    hasToc,
    activeIndex,
    activeItem,
    setArticle,
    setActiveId,
    setActiveIndex,
    jumpTo,
    jumpToIndex,
    jumpBy,
    clear
  }
})
