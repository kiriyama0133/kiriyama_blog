import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useContentStore } from '~/stores/content'
import { MAX_WEEKS, buildHeatmapGrid, countNotesByDay } from '~/utils/heatmap'

export interface UseUpdateHeatmapOptions {
  /**
   * 最多画几周（可传 ref / getter）。窄屏传小一点，宁可少画几周，
   * 也不要把几十列硬塞进几百像素、格子被挤成发丝。
   */
  maxWeeks?: MaybeRefOrGetter<number | undefined>
}

/**
 * 更新热力图的响应式数据源。
 *
 * 只负责「store 里的笔记 → 热力图矩阵」这一段，不含任何图表样式：
 * 组件拿到的 `grid` 直接喂给 `VueUiHeatmap` 的 `dataset`。
 */
export function useUpdateHeatmap(options: UseUpdateHeatmapOptions = {}) {
  const store = useContentStore()

  /** 每天更新了几篇（只统计 frontmatter 写了 `date` 的） */
  const counts = computed(() => countNotesByDay(store.documents.map((doc) => doc.date)))

  const weeks = computed(() => toValue(options.maxWeeks) ?? MAX_WEEKS)

  /** 日历矩阵：行 = 周一..周日，列 = 周 */
  const grid = computed(() => buildHeatmapGrid(counts.value, { maxWeeks: weeks.value }))

  /** 有没有任何带日期的笔记 —— 没有的话组件显示占位文案 */
  const hasData = computed(() => grid.value.columns > 0)

  return { counts, grid, hasData }
}
