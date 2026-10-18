<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const wrapperRef = ref(null)
const trackRef = ref(null)
let tween = null

// 直接写死你要展示的技术栈或内容
const items = [
  { name: 'Vue.js', color: '#41B883' },
  { name: 'Nuxt.js', color: '#00DC82' },
  { name: 'GSAP', color: '#0AE448' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'TailwindCSS', color: '#38BDF8' },
  { name: 'Vite', color: '#646CFF' },
  { name: 'Node.js', color: '#339933' },
  { name: 'Figma', color: '#F24E1E' },
  { name: 'Nuxt Content', color: '#00DC82' },
  { name: 'CSS3', color: '#1572B6' }
]

onMounted(() => {
  if (!trackRef.value) return

  // 使用 xPercent: -50 实现完美无缝循环
  // 因为我们会在模板里渲染两组完全相同的内容
  tween = gsap.to(trackRef.value, {
    xPercent: -50,
    ease: 'none',
    duration: 25, // 跑完一整圈所需的时间（秒），越大越慢
    repeat: -1 // 无限循环
  })

  // 鼠标悬停时暂停，移开继续
  const wrapper = wrapperRef.value
  wrapper.addEventListener('mouseenter', () => tween.pause())
  wrapper.addEventListener('mouseleave', () => tween.play())
})

onUnmounted(() => {
  if (tween) tween.kill()
})
</script>

<template>
  <div ref="wrapperRef" class="marquee-wrapper">
    <!-- 左右两侧的渐隐遮罩 -->
    <div class="fade-left" />
    <div class="fade-right" />

    <!-- 轨道 -->
    <div ref="trackRef" class="marquee-track">
      <!-- 渲染两组一模一样的内容，无缝衔接 -->
      <div v-for="i in 2" :key="i" class="marquee-group">
        <div v-for="item in items" :key="item.name" class="marquee-item">
          <!-- 小圆点指示器，带主题色 -->
          <span class="dot" :style="{ backgroundColor: item.color }" />
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #0e100f;
  padding: 1.5rem 0;
  border-top: 1px solid #2a2c30;
  border-bottom: 1px solid #2a2c30;
  cursor: crosshair;
}

/* 轨道：占据内容总宽度，用 flex 排布 */
.marquee-track {
  display: flex;
  width: fit-content;
  /* 这里不写 animation，全部由 GSAP 接管 */
}

/* 内容组：每个组内部是一排内容 */
.marquee-group {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding-right: 3rem; /* 组与组之间的间距，保证无缝 */
}

/* 单个技术项 */
.marquee-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #7c7c6f;
  white-space: nowrap;
  transition: color 0.3s;
  user-select: none;
}

/* 鼠标放上去单行高亮 */
.marquee-item:hover {
  color: #fffce1;
}

/* 前面的发光小圆点 */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
}

/* 渐隐遮罩 */
.fade-left,
.fade-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 120px;
  z-index: 10;
  pointer-events: none;
}
.fade-left {
  left: 0;
  background: linear-gradient(to right, #0e100f 10%, transparent);
}
.fade-right {
  right: 0;
  background: linear-gradient(to left, #0e100f 10%, transparent);
}
</style>
