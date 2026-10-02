<!--
  SpinCircle —— 一个简单的转圈加载指示器。

  颜色取自项目调色板（SFC 的 scoped 样式读不到 main.scss 里的 $color-*，
  这里直接写死同样的色值，改色时记得和 main.css 的 @theme / main.scss 同步）：
    · 轨道   #E0E0F0  ≈ light-secondary
    · 旋转头 #969780  ≈ light-button-hover（暖橄榄，和整体色系同源）
-->
<template>
  <span class="spin" role="status" :aria-label="label">
    <span class="sr-only">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '加载中' })
</script>

<style lang="scss" scoped>
.spin {
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 2px solid #e0e0f0;
  border-top-color: #969780;
  border-radius: 50%;
  animation: spin-circle 0.7s linear infinite;
}

@keyframes spin-circle {
  to {
    transform: rotate(360deg);
  }
}

// 尊重「减少动态效果」偏好：转慢一点而不是彻底不转，否则没了加载中的暗示
@media (prefers-reduced-motion: reduce) {
  .spin {
    animation-duration: 1.6s;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
