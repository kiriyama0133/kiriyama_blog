<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const props = defineProps({
  // 滚动跟随区域的高度（默认 200vh，留出足够的滚动距离）
  height: { type: String, default: '200vh' },
  // 动画的起始和结束缓动
  ease: { type: String, default: 'none' }
})

const containerRef = ref(null)
const stickyRef = ref(null)
const contentRef = ref(null)

onMounted(async () => {
  await nextTick()
  if (!containerRef.value || !contentRef.value) return

  // 核心逻辑：让内部的内容吸顶，并让动画进度与滚动条绑定
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: containerRef.value,
      start: 'top top', // 当容器的顶部到达视口顶部时开始
      end: 'bottom bottom', // 当容器的底部到达视口底部时结束
      scrub: 1, // 平滑跟随：1 表示有 1 秒的缓动延迟，让手感更顺滑
      pin: stickyRef.value, // 把内容区域钉在屏幕上
      pinSpacing: false, // 因为外层容器已经有 height，这里不需要额外加 padding
      anticipatePin: 1 // 防止快速滚动时产生 1px 的抖动
    }
  })

  // 下面是你希望随着滚动进度发生的动画
  // 这里以“文字放大、颜色渐变、旋转”为例，你可以任意修改
  tl.fromTo(
    contentRef.value,
    {
      scale: 0.5,
      rotation: -45,
      opacity: 0
    },
    {
      scale: 1.2,
      rotation: 0,
      opacity: 1,
      ease: props.ease
      // 你可以在这里继续叠加其他属性
    }
  )
})

onUnmounted(() => {
  // 必须清理 ScrollTrigger，防止页面切换后残留
  ScrollTrigger.getAll().forEach((t) => t.kill())
})

// function scrollToTop() {
//   window.scrollTo({ top: containerRef.value.offsetTop, behavior: 'smooth' })
// }
</script>

<template>
  <div ref="containerRef" class="scroll-parallax-container" :style="{ height: props.height }">
    <div ref="stickyRef" class="sticky-wrapper">
      <div ref="contentRef" class="scroll-content">
        <!-- 默认插槽，由 MDC 传入内容 -->
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scroll-parallax-container {
  position: relative;
  width: 100%;
  background: var(--ui-backdrop, #f6f6f7);
  border-radius: 12px;
  border: 1px solid var(--ui-line, #e2e2e3);
  margin: 2rem 0;
  overflow: hidden;
}

.sticky-wrapper {
  width: 100%;
  height: 100vh; /* 占满整个屏幕 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.scroll-content {
  /* 这里可以自定义内容的基础样式，动画由 GSAP 控制 */
  padding: 2rem;
  max-width: 800px;
  text-align: center;
  color: #0e100f;
  font-size: 1.5rem;
  font-weight: bold;
  will-change: transform, opacity; /* 提示浏览器开启硬件加速 */
}
</style>
