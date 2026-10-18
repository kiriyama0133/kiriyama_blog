<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const containerRef = ref(null)
const overlayRef = ref(null)
let moveXTo, moveYTo

onMounted(() => {
  const el = containerRef.value
  const overlay = overlayRef.value
  if (!el || !overlay) return

  // 默认放在中心
  let currentX = el.offsetWidth / 2
  let currentY = el.offsetHeight / 2

  // 更新背景的函数
  const updateGradient = () => {
    // 外圈光晕
    const bg1 = `radial-gradient(400px circle at ${currentX}px ${currentY}px, rgba(10, 228, 72, 0.15), transparent 80%)`
    // 内圈高光
    const bg2 = `radial-gradient(150px circle at ${currentX}px ${currentY}px, rgba(10, 228, 72, 0.3), transparent 100%)`

    overlay.style.background = `${bg2}, ${bg1}`
  }

  // 初始化渲染
  updateGradient()

  // 使用 quickTo 实时更新坐标变量
  // 我们用一个 proxy 对象来承接数值，防止直接修改 DOM 造成的性能浪费
  const proxy = { x: currentX, y: currentY }

  moveXTo = gsap.quickTo(proxy, 'x', {
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: () => {
      currentX = proxy.x
      updateGradient()
    }
  })

  moveYTo = gsap.quickTo(proxy, 'y', {
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: () => {
      currentY = proxy.y
      updateGradient()
    }
  })

  const onMouseMove = (e) => {
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    moveXTo(x)
    moveYTo(y)
  }

  el.addEventListener('mousemove', onMouseMove)

  // 清理函数
  el._cleanup = () => {
    el.removeEventListener('mousemove', onMouseMove)
  }
})

onUnmounted(() => {
  if (containerRef.value && containerRef.value._cleanup) {
    containerRef.value._cleanup()
  }
})
</script>

<template>
  <div ref="containerRef" class="spotlight-wrapper">
    <!-- 光晕层 -->
    <div ref="overlayRef" class="spotlight-overlay" />

    <!-- 内容层 -->
    <div class="content">
      <h2 class="title">聚光灯特效</h2>
      <p class="desc">把鼠标移上来，光晕会紧紧跟着你。</p>
    </div>
  </div>
</template>

<style scoped>
.spotlight-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: #0e100f;
  /* 加上网格背景，更有科技感 */
  background-image:
    linear-gradient(#1a1c1f 1px, transparent 1px),
    linear-gradient(90deg, #1a1c1f 1px, transparent 1px);
  background-size: 30px 30px;
  border-radius: 16px;
  border: 1px solid #2a2c30;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: crosshair;
}

.spotlight-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  /* 这里的 background 会由 JS 动态覆盖 */
}

.content {
  position: relative;
  z-index: 2;
  text-align: center;
  pointer-events: none;
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fffce1;
  margin: 0 0 1rem 0;
  text-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
}

.desc {
  font-size: 1.1rem;
  color: #7c7c6f;
  margin: 0;
}
</style>
