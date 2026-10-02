<!--
  RightRail —— 右侧固定导轨：扇形导航 + 滚动指示条(RightTab) 拼成一列。

  index-layout（文档列表：RightTabWithNav）与 slug-layout（文档锚点：TocFanNav）
  都用它，这样"固定定位 + 两件套排列 + ClientOnly 包裹"只写一次。
-->
<script setup lang="ts">
import { computed } from 'vue'
import RightTab from '~/components/RightTab.vue'

const props = withDefaults(
  defineProps<{
    /** 扇形那一列的宽度 */
    fanWidth?: string
    /** 扇形与指示条之间的间距 */
    gap?: string
  }>(),
  {
    fanWidth: '13.5rem',
    gap: '0.75rem',
  },
)

// 自定义属性走 style，让 CSS 变量能覆盖默认值
const railStyle = computed(
  () =>
    ({
      '--rail-fan-width': props.fanWidth,
      '--rail-gap': props.gap,
    }) as unknown as Record<string, string>,
)
</script>

<template>
  <ClientOnly>
    <div class="right-rail" :style="railStyle">
      <div class="right-rail__fan">
        <slot />
      </div>
      <RightTab class="right-rail__tab" />
    </div>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.right-rail {
  position: fixed;
  right: 0.5rem;
  top: 50%;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: var(--rail-gap, 0.75rem);
  transform: translateY(-50%);
}

.right-rail__fan {
  width: var(--rail-fan-width, 13.5rem);
}
</style>
