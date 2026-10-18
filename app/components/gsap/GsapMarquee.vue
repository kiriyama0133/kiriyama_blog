<!--
  GsapMarquee —— 技术栈跑马灯。

  配色说明：整条带子跟页面同底色（--ui-canvas），靠上下两根发丝线（--ui-line）
  圈出范围；两侧渐隐遮罩必须用同一个色值，否则会变成两块生硬的色块。
  文字走 --ui-text-muted / --ui-text-strong，明暗主题自动跟着翻。
  小圆点保留各家品牌色 —— 那是这条带子唯一的彩色，别改成主题色。
-->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const trackRef = ref(null)
let tween = null

// 展示的技术栈。color 用品牌色，只作用于前面的小圆点。
const items = [
  { name: 'Vue.js', color: '#41B883' },
  { name: 'Nuxt.js', color: '#00DC82' },
  { name: 'Nuxt Content', color: '#00DC82' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'TailwindCSS', color: '#38BDF8' },
  { name: 'CSS3', color: '#1572B6' },
  { name: 'Vite', color: '#646CFF' },
  { name: 'GSAP', color: '#0AE448' },
  { name: 'Three.js', color: '#049EF4' }, // 官方黑标，暗底不可见，取官网链接色
  { name: 'React', color: '#61DAFB' },
  { name: 'Node.js', color: '#339933' },
  { name: '.NET', color: '#512BD4' },
  { name: 'ASP.NET', color: '#7A5CFF' }, // 与 .NET 同族，浅一档区分
  { name: 'WPF', color: '#68217A' },
  { name: 'Win32', color: '#0078D4' },
  { name: 'Avalonia', color: '#8B44AC' },
  { name: 'Xamarin', color: '#3498DB' },
  { name: 'PostgreSQL', color: '#4169E1' },
  { name: 'MongoDB', color: '#47A248' },
  { name: 'RabbitMQ', color: '#FF6600' }
]

function pause() {
  tween?.pause()
}

function resume() {
  tween?.play()
}

onMounted(() => {
  if (!trackRef.value) return

  // 尊重系统「减少动态效果」：不做无限滚动，静态排一行就够
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  // 模板里渲染了两组完全相同的内容，所以位移 -50% 正好接上，看起来无缝。
  // duration 是「跑完一整圈」的秒数：条目增减后要跟着调（20 条约 50s），否则滚动速度会明显变化。
  tween = gsap.to(trackRef.value, {
    xPercent: -50,
    ease: 'none',
    duration: 50,
    repeat: -1
  })
})

onUnmounted(() => {
  tween?.kill()
  tween = null
})
</script>

<template>
  <div class="marquee-wrapper" @mouseenter="pause" @mouseleave="resume">
    <!-- 左右两侧的渐隐遮罩，颜色跟页面底色一致 -->
    <div class="fade-left" />
    <div class="fade-right" />

    <!-- 轨道 -->
    <div ref="trackRef" class="marquee-track">
      <!-- 渲染两组一模一样的内容，无缝衔接 -->
      <div v-for="i in 2" :key="i" class="marquee-group" :aria-hidden="i > 1 ? 'true' : null">
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
  /* 跟页面画布同色，融进背景 */
  background: var(--ui-canvas);
  padding: 1.5rem 0;
  border-top: 1px solid var(--ui-line);
  border-bottom: 1px solid var(--ui-line);
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
  color: var(--ui-text-muted);
  white-space: nowrap;
  transition: color 0.3s;
  user-select: none;
}

/* 鼠标放上去单行高亮 */
.marquee-item:hover {
  color: var(--ui-text-strong);
}

/* 前面的小圆点 */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
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
  background: linear-gradient(to right, var(--ui-canvas) 10%, transparent);
}
.fade-right {
  right: 0;
  background: linear-gradient(to left, var(--ui-canvas) 10%, transparent);
}
</style>
