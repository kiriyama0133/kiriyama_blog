<!--
  SpinCircle —— 一个简单的转圈加载指示器。

  颜色走 main.css 的语义变量（跟着 .dark 自己翻），不要在组件里写死色值：
    · 轨道   --ui-spin-track  ≈ light-secondary / dark-secondary
    · 旋转头 --ui-spin-head   ≈ 暖橄榄，和整体色系同源
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
  border: 2px solid var(--ui-spin-track);
  border-top-color: var(--ui-spin-head);
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
