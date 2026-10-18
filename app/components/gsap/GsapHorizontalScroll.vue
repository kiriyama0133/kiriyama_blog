<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

const containerRef = ref(null)
const trackRef = ref(null)

onMounted(async () => {
  await nextTick()
  if (!containerRef.value || !trackRef.value) return

  // 获取需要横向滚动的轨道元素
  const track = trackRef.value
  // 获取所有面板项
  const panels = gsap.utils.toArray('.panel', track)

  // 关键逻辑：垂直滚动转换为横向平移
  gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: containerRef.value,
      start: 'top top', // 当容器顶部到达视口顶部时开始
      end: () => '+=' + (track.scrollWidth - window.innerWidth), // 滚动距离等于横向超出的宽度
      pin: true, // 把容器钉在屏幕上
      scrub: 1, // 平滑跟随，1秒延迟让手感更顺
      invalidateOnRefresh: true, // 窗口尺寸变化时重新计算
      anticipatePin: 1
    }
  })

  // 附加效果：每个面板进入屏幕时的轻微动画（可选）
  panels.forEach((panel) => {
    gsap.from(panel.querySelector('.panel-content'), {
      scale: 0.8,
      opacity: 0.5,
      scrollTrigger: {
        trigger: panel,
        containerAnimation: gsap.getTweensOf(track)[0], // 这是横向滚动中触发内部动画的关键
        start: 'left center', // 当面板左侧到达屏幕中心时
        end: 'right center',
        scrub: true,
        toggleActions: 'play none none reverse'
      }
    })
  })
})

onUnmounted(() => {
  ScrollTrigger.getAll().forEach((t) => t.kill())
})
</script>

<template>
  <div ref="containerRef" class="horizontal-container">
    <div ref="trackRef" class="horizontal-track">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* 容器：固定在屏幕上，阻止原生横向滚动 */
.horizontal-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #1d1f20;
}

/* 轨道：弹性排布所有面板 */
.horizontal-track {
  display: flex;
  flex-wrap: nowrap;
  width: fit-content;
  height: 100vh;
  align-items: center;
  padding: 0 10vw; /* 两侧留白 */
  will-change: transform;
}

/* 针对 slot 传入的面板默认样式（可被 MDC 内联覆盖） */
.horizontal-track :deep(.panel) {
  width: 80vw;
  height: 60vh;
  flex-shrink: 0;
  margin-right: 5vw;
  border-radius: 16px;
  background: #232323;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.horizontal-track :deep(.panel-content) {
  padding: 2rem;
  text-align: center;
}
</style>
