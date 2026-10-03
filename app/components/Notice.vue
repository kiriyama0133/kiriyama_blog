<script setup lang="ts">
import { useNotice } from '~/composables/useNotice'

/**
 * 轻提示的 UI 部分，挂在 app.vue 里全站一份。
 * 状态在 `composables/useNotice.ts`，这里只负责显示。
 */
const { message } = useNotice()
</script>

<template>
  <ClientOnly>
    <Transition name="notice">
      <div v-if="message" class="notice" role="status" aria-live="polite">
        {{ message }}
      </div>
    </Transition>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.notice {
  position: fixed;
  left: 50%;
  bottom: 4.5rem;
  z-index: 60;
  padding: 0.4rem 0.9rem;
  border-radius: 0.5rem;
  /* 亮色：深底浅字；暗色：浅底深字（见 main.css 的 .dark --ui-*） */
  background-color: var(--ui-toast-bg);
  color: var(--ui-toast-text);
  font-size: 0.8125rem;
  line-height: 1.4;
  white-space: nowrap;
  pointer-events: none;
  transform: translateX(-50%);
  box-shadow: 0 10px 24px -14px rgb(0 0 0 / 0.5);
}

.notice-enter-active,
.notice-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translate(-50%, 0.4rem);
}
</style>
