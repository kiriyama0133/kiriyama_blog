<script setup lang="ts">
import { computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import topIcon from '~/assets/image/top-svgrepo-com.svg'

const { y } = useWindowScroll()

const visible = computed(() => y.value > 240)

const iconStyle = {
  '-webkit-mask-image': `url("${topIcon}")`,
  'mask-image': `url("${topIcon}")`
}

function toTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
</script>

<template>
  <ClientOnly>
    <Transition name="btt">
      <div v-show="visible" class="back-to-top">
        <div class="container back-to-top__inner">
          <button type="button" class="btn back-to-top__btn" aria-label="回到顶部" @click="toTop">
            <span class="back-to-top__icon" :style="iconStyle" aria-hidden="true" />
            <span class="back-to-top__label">回到顶部</span>
          </button>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<style lang="scss" scoped>
.back-to-top {
  position: fixed;
  inset: auto 0 1rem 0;
  z-index: 40;
  pointer-events: none;
}

.back-to-top__inner {
  display: flex;
  justify-content: flex-start;
}

.back-to-top__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  line-height: 1;
  pointer-events: auto;
  box-shadow: 0 10px 24px -14px rgb(0 0 0 / 0.5);
}

.back-to-top__icon {
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

// 窄屏收成纯图标，跟 Search / TypeDropdown 的响应式行为对齐
@media (width < 640px) {
  .back-to-top__label {
    display: none;
  }
}

.btt-enter-active,
.btt-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.btt-enter-from,
.btt-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>
