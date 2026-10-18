<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { gsap } from 'gsap'

const cardRef = ref(null)
let xTo, yTo
let cardEl = null

function onMouseMove(e) {
  if (!cardEl) return
  const { left, top, width, height } = cardEl.getBoundingClientRect()
  const x = (e.clientX - left) / width - 0.5
  const y = (e.clientY - top) / height - 0.5

  // 旋转幅度加大，确保肉眼可见
  xTo(x * 40)
  yTo(-y * 40)
}

function onMouseLeave() {
  xTo(0)
  yTo(0)
}

onMounted(() => {
  cardEl = cardRef.value
  if (!cardEl) return

  // 使用 quickTo 实现丝滑极速跟随
  xTo = gsap.quickTo(cardEl, 'rotationY', { duration: 0.5, ease: 'power3.out' })
  yTo = gsap.quickTo(cardEl, 'rotationX', { duration: 0.5, ease: 'power3.out' })

  cardEl.addEventListener('mousemove', onMouseMove)
  cardEl.addEventListener('mouseleave', onMouseLeave)
})

onUnmounted(() => {
  if (cardEl) {
    cardEl.removeEventListener('mousemove', onMouseMove)
    cardEl.removeEventListener('mouseleave', onMouseLeave)
  }
})
</script>

<template>
  <div class="tilt-wrapper">
    <div ref="cardRef" class="tilt-card">
      <!-- 全部内容写死在内部 -->
      <div class="card-inner">
        <div class="icon">✨</div>
        <h3 class="title">3D 魔法卡片</h3>
        <p class="desc">
          把鼠标放在这张卡片上，它会发生三维空间的倾斜。
          你的鼠标在左边，卡片左边就会靠近你；鼠标在右边，右边就会靠近你。
        </p>
        <div class="badge">GSAP + Vue</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 外层：提供 3D 景深 */
.tilt-wrapper {
  perspective: 1000px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  width: 100%;
}

/* 卡片本体 */
.tilt-card {
  width: 320px;
  height: 420px;
  border-radius: 20px;
  background: linear-gradient(145deg, #1f2023, #111215);
  border: 1px solid #333;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);

  /* 必须开启 3D 空间 */
  transform-style: preserve-3d;
  will-change: transform;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

/* 加一层高光遮罩，让 3D 旋转更有质感 */
.tilt-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 20%,
    rgba(255, 255, 255, 0.05) 30%,
    transparent 40%
  );
  z-index: 10;
  pointer-events: none;
}

/* 内部内容：Z 轴凸起 40px，实现悬浮感 */
.card-inner {
  padding: 2.5rem 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transform: translateZ(40px); /* 核心：让文字浮在卡片上方 */
}

.icon {
  font-size: 3rem;
  margin-bottom: auto;
  text-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
}

.title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #fffce1;
  margin: 0 0 1rem 0;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #9ca3af;
  margin: 0 0 1.5rem 0;
}

.badge {
  align-self: flex-start;
  padding: 0.4rem 0.8rem;
  background: rgba(10, 228, 72, 0.1);
  color: #0ae448;
  border: 1px solid rgba(10, 228, 72, 0.3);
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 1px;
}
</style>
