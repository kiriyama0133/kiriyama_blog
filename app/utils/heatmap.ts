/**
 * 更新热力图的数据构建（纯函数，不碰 Vue、不碰 DOM）。
 *
 * 输入是笔记 frontmatter 的 `date`（已经在 store 里归一成 `YYYY-MM-DD`，没写就是空串），
 * 输出是 `vue-data-ui` 的 `VueUiHeatmap` 直接能吃的「行 = 星期、列 = 周」矩阵。
 *
 * 为什么是「行 = 星期」：那个组件的格子是「行数 × 列数」的矩阵，
 * `layout.width` 决定列宽、`layout.height` 决定行高。日历形状天生是 7 行 × N 列，
 * 列数随数据增长 —— 正好让宽的那一维横向铺开，窄的固定 7 行。
 */

/**
 * 行顺序固定从周一开始。
 * 这里只存「第几行」，真正显示出来的文字由 i18n 提供（见 `useUpdateHeatmap`），
 * 因为这个工具函数是纯函数，不碰 Vue 也不碰 locale。
 */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

/** 没传 `weekdayLabels` 时的兜底显示文案（调用方通常都会传本地化后的标签） */
export const DEFAULT_WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const

/** 一年视图。数据跨度超过它就滑动窗口，只保留最近这么多周，避免列数无限膨胀 */
export const MAX_WEEKS = 53

export interface HeatmapRow {
  /** 行名，会被 `VueUiHeatmap` 当作 y 轴标签直接显示 */
  name: string
  /** 每列一个值；`null` = 该格子在数据区间之外（不是「那天没有更新」） */
  values: (number | null)[]
}

export interface HeatmapGrid {
  /** 7 行（周一 .. 周日） */
  dataset: HeatmapRow[]
  /** 每列的 x 轴标签：只在月份变化的列给 `M月`，其余空串（不画） */
  xLabels: string[]
  /**
   * 每列对应的周一日期（`YYYY-MM-DD`），长度 = `columns`。
   * 组件靠它把「行 + 列」还原成精确日期 —— `VueUiHeatmap` 的 tooltip 只给行列标签，
   * 而 x 轴标签为了好看是抽稀的，拿不到每周的日期。
   */
  columnDates: string[]
  /** y 轴标签，与 `dataset` 的行一一对应 */
  yLabels: string[]
  /** 列数（周数）；0 = 没有任何带日期的笔记 */
  columns: number
  /** 落在窗口内的更新总数（= 有日期的笔记数） */
  total: number
  /** 单日最高更新数，给图例/副标题用 */
  maxCount: number
  /** 有更新的天数（>= 1 的天数） */
  activeDays: number
  /** 窗口覆盖的首尾日期（`YYYY-MM-DD`，含首尾，已按周补齐） */
  start: string
  end: string
}

function emptyGrid(weekdayLabels: readonly string[]): HeatmapGrid {
  return {
    dataset: weekdayLabels.map((name) => ({ name, values: [] })),
    xLabels: [],
    columnDates: [],
    yLabels: [...weekdayLabels],
    columns: 0,
    total: 0,
    maxCount: 0,
    activeDays: 0,
    start: '',
    end: ''
  }
}

function pad(n: number): string {
  return `${n}`.padStart(2, '0')
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * 解析 `YYYY-MM-DD`。刻意用本地构造（`new Date(y, m, d)`）而不是 `Date.parse`：
 * 后者对纯日期串按 UTC 解释，UTC+8 的凌晨会倒回前一天。
 */
function parseDay(key: string): Date | null {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!matched) return null
  const date = new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

/** 周一 = 0 .. 周日 = 6 */
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - weekdayIndex(date))
  return monday
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/** 把一堆 `YYYY-MM-DD` 按天计数；空串与非法值直接跳过 */
export function countNotesByDay(dates: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const raw of dates) {
    if (!raw || !parseDay(raw)) continue
    counts.set(raw, (counts.get(raw) ?? 0) + 1)
  }
  return counts
}

/** `YYYY-MM-DD` 偏移若干天，仍是 `YYYY-MM-DD`；输入不合法返回空串 */
export function shiftDayKey(key: string, days: number): string {
  const date = parseDay(key)
  return date ? dayKey(addDays(date, days)) : ''
}

/**
 * 把「每天更新数」摊成日历矩阵。
 *
 * 区间取 `[最早日期, max(最晚日期, 今天)]`，两端按周补齐；
 * 超过 `maxWeeks` 周就滑动窗口，保留最近的那一段。
 */
export function buildHeatmapGrid(
  counts: Map<string, number>,
  options: {
    today?: Date
    maxWeeks?: number
    /** 7 个周标签，顺序固定周一 → 周日；不传用中文兜底 */
    weekdayLabels?: readonly string[]
  } = {}
): HeatmapGrid {
  const today = startOfDay(options.today ?? new Date())
  const maxWeeks = options.maxWeeks ?? MAX_WEEKS
  const weekdayLabels = options.weekdayLabels ?? DEFAULT_WEEKDAY_LABELS

  const days = [...counts.keys()]
    .map(parseDay)
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime())

  if (days.length === 0) return emptyGrid(weekdayLabels)

  const firstDay = days[0]
  const lastDay = days[days.length - 1]
  if (!firstDay || !lastDay) return emptyGrid(weekdayLabels)

  // 最晚日期可能在未来（笔记可以预填日期），所以和今天取大值，别把未来的更新裁掉
  const rangeEnd = lastDay.getTime() > today.getTime() ? lastDay : today

  let weekStart = startOfWeek(firstDay)
  const weekEnd = addDays(startOfWeek(rangeEnd), 6)

  let columns = Math.round((weekEnd.getTime() - weekStart.getTime()) / 86_400_000 / 7) + 1
  if (columns > maxWeeks) {
    columns = maxWeeks
    weekStart = addDays(weekEnd, -7 * (columns - 1))
  }

  const dataset = weekdayLabels.map((name, rowIndex) => {
    const values: (number | null)[] = []
    for (let week = 0; week < columns; week += 1) {
      const date = addDays(weekStart, week * 7 + rowIndex)
      // 补齐出来的首尾半周不算「那天没更新」，置 null
      if (date.getTime() < firstDay.getTime() || date.getTime() > weekEnd.getTime()) {
        values.push(null)
      } else {
        values.push(counts.get(dayKey(date)) ?? 0)
      }
    }
    return { name, values }
  })

  // 每列的周一日期：tooltip 用它 + 行下标还原出这一格的精确日期
  const columnDates: string[] = []
  // x 轴只在「月份发生变化」的那一列打标签，避免 32 列全挤满日期
  const xLabels: string[] = []
  let previousMonth = -1
  for (let week = 0; week < columns; week += 1) {
    const monday = addDays(weekStart, week * 7)
    columnDates.push(dayKey(monday))
    const month = monday.getMonth()
    xLabels.push(month === previousMonth ? '' : `${month + 1}月`)
    previousMonth = month
  }

  let total = 0
  let maxCount = 0
  let activeDays = 0
  for (const row of dataset) {
    for (const value of row.values) {
      if (typeof value !== 'number' || value <= 0) continue
      total += value
      activeDays += 1
      if (value > maxCount) maxCount = value
    }
  }

  return {
    dataset,
    xLabels,
    columnDates,
    yLabels: [...weekdayLabels],
    columns,
    total,
    maxCount,
    activeDays,
    start: dayKey(weekStart),
    end: dayKey(weekEnd)
  }
}
