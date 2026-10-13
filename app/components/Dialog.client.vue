<template>
  <Teleport to="body">
    <div v-if="isOpen" class="overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <VueUiSparkStackbar :dataset="store.chartDataset" :config="sparkConfig" />
        <UpdateHeatmap />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { VueUiSparkStackbar } from 'vue-data-ui'
import 'vue-data-ui/style.css'

// <UpdateHeatmap> 是 components/UpdateHeatmap.client.vue，走 Nuxt 自动注册（和本组件同一套路）

const store = useContentStore()
const { t } = useI18n()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const closeDialog = () => {
  isOpen.value = false
}

/**
 * 上色说明：vue-data-ui 把颜色写在 SVG 的 `fill` **属性**上，而属性不支持 `var()`。
 * 所以这里统一用 `currentColor`（属性关键字，合法），实际颜色由 .dialog 的 `color`
 *（= --ui-text）给出，跟着 .dark 一起翻。条形颜色不用配 —— dataset 每一项都自带 color。
 *
 * 写成 computed：弹窗开着时切语言，标题要立刻跟着变。
 */
const sparkConfig = computed(() => ({
  style: {
    backgroundColor: 'transparent',
    title: {
      text: t('chart.categoryTitle'),
      color: 'currentColor',
      fontSize: 14,
      bold: true,
      textAlign: 'center' as const,
      margin: '0 auto 16px'
    },
    legend: {
      show: true,
      margin: '16px auto 0',
      textAlign: 'center' as const,
      fontSize: 12,
      // 关掉「全选」开关，图例只用来读分类
      selectAllToggle: { show: false },
      name: { color: 'currentColor' },
      value: { show: true, color: 'currentColor' },
      percentage: { show: true, color: 'currentColor' }
    }
  }
}))
</script>

<style lang="scss" scoped>
.dialog {
  /* 热力图列多的时候要宽度，窄屏用 vw 兜住；超高就内部滚动 */
  width: min(620px, 92vw);
  max-height: 88vh;
  overflow-y: auto;
  padding: 28px 24px;
  /* 图表文字全部走 currentColor，颜色统一从这里继承 */
  color: var(--ui-text);
  background: var(--ui-backdrop);
  border-radius: 8px;
}

/* 两张图之间拉一条分隔线 */
.dialog > :last-child {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--ui-line);
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}
</style>
