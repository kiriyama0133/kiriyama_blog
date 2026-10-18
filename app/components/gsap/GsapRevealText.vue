<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

const containerRef = ref(null)
let split = null
let tl = null

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return

  const title = containerRef.value.querySelector('.reveal-title')
  if (!title) return

  // 1. 拆分文字
  split = new SplitText(title, { type: 'lines,words' })

  // 2. 加遮罩
  split.lines.forEach((line) => {
    line.style.overflow = 'hidden'
    line.style.display = 'block'
    line.style.paddingBottom = '10px'
  })

  // 3. 创建动画
  tl = gsap.timeline({ paused: true })
  tl.from(split.words, {
    yPercent: 120,
    rotation: 5,
    opacity: 0,
    duration: 0.8,
    stagger: 0.04,
    ease: 'back.out(1.7)'
  })

  // 4. 首次播放
  tl.play()

  // 5. 按钮呼吸光晕（不受重启影响）
  gsap.to('.glow-btn', {
    boxShadow: '0 0 20px 5px rgba(10, 228, 72, 0.4)',
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut'
  })
})

// 重播动画方法
function replayAnimation() {
  if (tl) {
    tl.restart()
  }
}

onUnmounted(() => {
  if (tl) tl.kill()
  if (split) split.revert()
})
</script>

<template>
  <div ref="containerRef" class="reveal-wrapper">
    <!-- 右上角重播按钮 -->
    <button class="replay-btn" title="重播动画" @click="replayAnimation">⟲ 重播</button>

    <div class="text-content">
      <h2 class="reveal-title">打造极致体验的<br />Web 交互动画</h2>
      <p class="subtitle">使用 GSAP 与 Nuxt Content，让每一段文字都拥有灵魂。</p>
    </div>

    <div class="btn-container">
      <button class="glow-btn">立即开启探索</button>
    </div>
  </div>
</template>

<style scoped>
.reveal-wrapper {
  position: relative; /* 给绝对定位的按钮做参照 */
  width: 100%;
  padding: 5rem 2rem;
  background: radial-gradient(circle at center, #1a1c1f 0%, #0e100f 100%);
  border-radius: 16px;
  border: 1px solid #2a2c30;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  overflow: hidden;
}

/* 重播按钮样式 */
.replay-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.4rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fffce1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #42433d;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.replay-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #0ae448;
  color: #0ae448;
}

.text-content {
  max-width: 600px;
  margin-bottom: 3rem;
}

.reveal-title {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fffce1;
  margin: 0 0 1.5rem 0;
}

.subtitle {
  font-size: 1.1rem;
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.btn-container {
  position: relative;
}

.glow-btn {
  padding: 1rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #000;
  background: #0ae448;
  border: none;
  border-radius: 99px;
  cursor: pointer;
  outline: none;
  transition: transform 0.2s;
}

.glow-btn:hover {
  transform: scale(1.05);
}
</style>
