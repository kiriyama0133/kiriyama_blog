import type { Ref } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'

export interface InfiniteListOptions {
  /** 每次增量展示多少条 */
  pageSize?: number
  /** 加载态最短展示时长（ms）——避免"闪一下就没了"，不是假延迟 */
  minSpin?: number
  /** 哨兵提前多少像素进入视口就开始加载 */
  rootMargin?: string
}

/**
 * 增量展示：数据本身已经在本地（store 里就是全量元数据），这里只控制「渲染多少条」，
 * 滚到底再把窗口放大一页。
 *
 * 为什么不在服务端 `.skip()/.limit()`：
 * 搜索 / 类型筛选本来就要全量元数据（不然搜不到未加载的文档），
 * 所以元数据一定已经全在 store 里了，再按页去服务端取等于把同样的行重复取一遍，
 * 反而更慢。真的数据量大到不能一次性取元数据时，再把数据源换成服务端分页即可。
 */
export function useInfiniteList<T>(source: Ref<T[]>, options: InfiniteListOptions = {}) {
  const pageSize = options.pageSize ?? 10
  const minSpin = options.minSpin ?? 320

  const visibleCount = ref(pageSize)
  const loadingMore = ref(false)
  const sentinel = ref<HTMLElement | null>(null)

  const total = computed(() => source.value.length)
  const visibleItems = computed(() => source.value.slice(0, visibleCount.value))
  const hasMore = computed(() => visibleCount.value < total.value)

  // 筛选条件变了（filteredSummaries 换了新数组）→ 回到第一页
  watch(source, () => {
    visibleCount.value = pageSize
    loadingMore.value = false
  })

  function sentinelInView() {
    const el = sentinel.value
    if (!el) return false
    const rect = el.getBoundingClientRect()
    return rect.top <= window.innerHeight && rect.bottom >= 0
  }

  async function loadMore() {
    if (loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    const started = performance.now()

    await nextTick()
    visibleCount.value = Math.min(visibleCount.value + pageSize, total.value)

    // 内容同步渲染得太快，spinner 会来不及显示，这里补足最小展示时长
    const elapsed = performance.now() - started
    if (elapsed < minSpin) {
      await new Promise(resolve => setTimeout(resolve, minSpin - elapsed))
    }
    loadingMore.value = false

    // 如果新增内容仍然填不满视口，哨兵会一直停在视口里 —— IntersectionObserver
    // 只在「进入/离开」时触发，所以这里必须自己再判断一次，否则会卡住不再加载。
    await nextTick()
    if (hasMore.value && sentinelInView()) void loadMore()
  }

  useIntersectionObserver(
    sentinel,
    ([entry]) => {
      if (entry?.isIntersecting) void loadMore()
    },
    { rootMargin: options.rootMargin ?? '240px 0px' },
  )

  return {
    sentinel,
    visibleItems,
    visibleCount,
    total,
    hasMore,
    loadingMore,
    loadMore,
  }
}
