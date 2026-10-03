<!--
  ThemeToggle —— 明暗切换按钮。

  位置：和 FloatingMenu 同一行（都是距顶 1rem），贴在容器右侧，
  所以两边按钮的水平内缩（1rem）与高度完全对齐。
  首页顶部有固定筛选条（4rem 高），那里往下让一行，别和搜索框叠在一起。
-->
<script setup lang="ts">
import { computed } from 'vue'
import moonIcon from '~/assets/image/dark-mode-night-moon-svgrepo-com.svg'
import sunIcon from '~/assets/image/dark-svgrepo-com.svg'
import { useTheme } from '~/composables/useTheme'

const { isDark, toggle } = useTheme()

// 图标 = 「点下去会切到的那个模式」：亮色时给月亮，暗色时给太阳
const iconStyle = computed(() => {
  const url = isDark.value ? sunIcon : moonIcon
  return {
    '-webkit-mask-image': `url("${url}")`,
    'mask-image': `url("${url}")`
  }
})

const label = computed(() => (isDark.value ? '切换到亮色' : '切换到暗色'))
</script>

<template>
  <div class="theme-toggle">
    <div class="container theme-toggle__inner">
      <!-- 首屏时 DOM 上已经有正确的类，这里只决定图标，客户端挂载即可 -->
      <ClientOnly>
        <button
          type="button"
          class="btn shadow-lg theme-toggle__btn"
          :title="label"
          :aria-label="label"
          :aria-pressed="isDark"
          @click="toggle"
        >
          <span class="theme-toggle__icon" :style="iconStyle" aria-hidden="true" />
        </button>
      </ClientOnly>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.theme-toggle {
  position: fixed;
  /* 默认和 FloatingMenu 同一行；首页有固定筛选条时由 --floating-top 推开（见 main.css） */
  inset: var(--floating-top, 1rem) 0 auto 0;
  // 比首页固定筛选条(z-50)高：不让它的 backdrop-filter 把按钮糊掉
  z-index: 55;
  pointer-events: none;
}

.theme-toggle__inner {
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.theme-toggle__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
}

.theme-toggle__icon {
  display: inline-block;
  flex: none;
  width: 1rem;
  height: 1rem;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

// 首页：顶部那条固定筛选条会占住这一行，
// 位移交给 main.css 的 --floating-top（body:has(.filter-bar) 时变成 4.75rem），
// 不在组件里写 :global(body:has(...)) & —— Vue 的 scoped 编译器会把 & 连同后面的选择器一起丢掉。
</style>
