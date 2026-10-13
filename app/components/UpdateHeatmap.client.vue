<template>
  <div ref="wrapper" class="update-heatmap">
    <div class="head">
      <h3 class="head__title">更新热力图</h3>
      <p class="head__meta">{{ meta }}</p>
    </div>

    <VueUiHeatmap v-if="hasData && layoutWidth > 0" :dataset="grid.dataset" :config="config" />
    <p v-else-if="!hasData" class="empty">笔记里还没有写 `date`，暂时画不出热力图</p>
  </div>
</template>

<script setup lang="ts">
import { VueUiHeatmap } from 'vue-data-ui'
import 'vue-data-ui/style.css'
import type { VueUiHeatmapDatapoint } from 'vue-data-ui'
import { useElementSize } from '@vueuse/core'
import { useUpdateHeatmap } from '~/composables/useUpdateHeatmap'
import { WEEKDAY_LABELS, shiftDayKey } from '~/utils/heatmap'

const MAX_CHART_WIDTH = 560
const CELL_TARGET = 16
const CHART_CHROME = 150

const { grid, hasData } = useUpdateHeatmap()

const WEEKDAY_ORDER: string[] = [...WEEKDAY_LABELS]
const wrapper = ref<HTMLElement | null>(null)
const { width: availableWidth } = useElementSize(wrapper)

const layoutWidth = computed(() => {
  const ideal = grid.value.columns * CELL_TARGET + CHART_CHROME
  const available = availableWidth.value || MAX_CHART_WIDTH
  return Math.round(Math.max(240, Math.min(ideal, available, MAX_CHART_WIDTH)))
})

const meta = computed(() => {
  if (!hasData.value) return ''
  const { start, end, activeDays, total } = grid.value
  return `${start} ~ ${end} · ${activeDays} 天有更新 · 共 ${total} 篇`
})

const { isDark } = useTheme()
const palette = ref({
  cold: '#e7e5d6',
  hot: '#7d8065',
  tooltipBg: '#ffffff',
  tooltipText: '#212122',
  tooltipBorder: '#e0e0f0'
})

function readPalette() {
  if (!import.meta.client) return
  const styles = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback
  palette.value = {
    cold: pick('--ui-heat-cold', '#e7e5d6'),
    hot: pick('--ui-heat-hot', '#7d8065'),
    tooltipBg: pick('--ui-alert-bg', '#ffffff'),
    tooltipText: pick('--ui-text', '#212122'),
    tooltipBorder: pick('--ui-line', '#e0e0f0')
  }
}

onMounted(readPalette)
watch(isDark, readPalette)

/** 坐标轴、图例、标题这些文字色统一走 currentColor，由外层 `color: var(--ui-text)` 提供 */
const config = computed(() => ({
  responsive: false,
  // 右上角那个「选项」菜单：图表已经很挤了，关掉
  userOptions: { show: false },
  table: { show: false },
  style: {
    fontFamily: 'inherit',
    // 格子间隙是用「背景色的描边」画出来的，透明 = 间隙透出弹窗底色
    backgroundColor: 'transparent',
    layout: {
      width: layoutWidth.value,
      height: 150,
      padding: { top: 4, right: 0, bottom: 0, left: 0 },
      cells: {
        colors: {
          hot: palette.value.hot,
          cold: palette.value.cold,
          underlayer: palette.value.cold
        },
        spacing: 2,
        value: { show: false }
      },
      dataLabels: {
        xAxis: {
          show: true,
          values: grid.value.xLabels,
          fontSize: 9,
          color: 'currentColor',
          rotation: 0,
          autoRotate: { enable: false }
        },
        yAxis: {
          show: true,
          values: grid.value.yLabels,
          fontSize: 10,
          color: 'currentColor'
        }
      }
    },
    title: { text: '' },
    legend: {
      show: true,
      width: 20,
      fontSize: 9,
      color: 'currentColor'
    },
    tooltip: {
      show: true,
      fontSize: 12,
      color: palette.value.tooltipText,
      backgroundColor: palette.value.tooltipBg,
      borderColor: palette.value.tooltipBorder,
      roundingValue: 0,
      customFormat: tooltipFormat
    }
  }
}))

/**
 * tooltip 文案。
 */
function tooltipFormat(params: {
  datapoint?: VueUiHeatmapDatapoint
  seriesIndex?: number
  series?: { temperatures?: VueUiHeatmapDatapoint[] }[]
}) {
  const datapoint = params.datapoint
  if (!datapoint) return ''

  const rowIndex = WEEKDAY_ORDER.indexOf(datapoint.yAxisName ?? '')
  const column = params.series?.[params.seriesIndex ?? 0]?.temperatures ?? []
  const columnIndex = column.findIndex((cell) => cell.id === datapoint.id)
  const monday = grid.value.columnDates[columnIndex] ?? ''
  const date = monday && rowIndex >= 0 ? shiftDayKey(monday, rowIndex) : ''
  const count = typeof datapoint.value === 'number' ? datapoint.value : 0

  return `<div style="line-height:1.6">
    <div style="font-weight:700">${date || '—'} 周${datapoint.yAxisName ?? ''}</div>
    <div style="display:flex;align-items:center;gap:6px">
      <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${datapoint.color}"></span>
      <span>${count} 篇</span>
    </div>
  </div>`
}
</script>

<style lang="scss" scoped>
.update-heatmap {
  /* 图表里所有 currentColor 都从这里取 */
  color: var(--ui-text);
  /* 窄屏时横向滚动，而不是把弹窗撑破 */
  overflow-x: auto;
}

.head {
  margin-bottom: 8px;
  text-align: center;

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: var(--ui-text-strong);
  }

  &__meta {
    margin-top: 2px;
    font-size: 11px;
    color: var(--ui-text-muted);
  }
}

.empty {
  padding: 12px 0;
  font-size: 12px;
  text-align: center;
  color: var(--ui-text-muted);
}
</style>
