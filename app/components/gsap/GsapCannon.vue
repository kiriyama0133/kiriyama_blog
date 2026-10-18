<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'

gsap.registerPlugin(Physics2DPlugin)

const wrapperRef = ref(null)
const cannonRef = ref(null)
const bulletsContainerRef = ref(null)

let masterTl = null
let bullets = []
let clickHandler = null

// 随机生成彩带颜色
const colors = ['#0ae448', '#fec5fb', '#00bae2', '#ff8709', '#9d95ff', '#abff84']

onMounted(async () => {
  await nextTick()
  if (!wrapperRef.value || !cannonRef.value) return

  const cannon = cannonRef.value
  const bulletsContainer = bulletsContainerRef.value
  const angle = 20

  // 1. 大炮摇摆时间线
  const tl1 = gsap
    .timeline()
    .to(cannon, { rotation: -angle, duration: 0.65, ease: 'power1.inOut' })
    .to(cannon, {
      rotation: angle,
      ease: 'power1.inOut',
      duration: 1,
      repeat: 3,
      yoyo: true
    })
    .to(cannon, { rotation: 0, duration: 0.65, ease: 'power1.inOut' })

  const tl1Time = tl1.duration()

  // 2. 动态生成 40 个彩带（用 div 模拟）
  bullets = []
  for (let i = 0; i < 40; i++) {
    const bullet = document.createElement('div')
    // 随机选个形状（长条或圆点）
    const isCircle = Math.random() > 0.5
    const color = colors[Math.floor(Math.random() * colors.length)]

    bullet.style.position = 'absolute'
    bullet.style.left = '50%'
    bullet.style.bottom = '20px' // 让彩带从大炮口出来
    bullet.style.width = isCircle ? '10px' : '20px'
    bullet.style.height = isCircle ? '10px' : '6px'
    bullet.style.backgroundColor = color
    bullet.style.borderRadius = isCircle ? '50%' : '2px'
    bullet.style.opacity = '0'
    bullet.style.willChange = 'transform, opacity'
    bullet.style.transform = 'translateX(-50%)'

    bulletsContainer.appendChild(bullet)
    bullets.push(bullet)
    // 随机初始大小
    gsap.set(bullet, { scale: 'random(0.4, 0.8)' })
  }

  // 3. 彩带发射物理时间线
  const tl2 = gsap
    .timeline()
    .to(bullets, {
      opacity: 1,
      duration: 0.25,
      stagger: { amount: tl1Time } // 在摇摆期间依次出现
    })
    .to(
      bullets,
      {
        duration: tl1Time,
        physics2D: {
          velocity: 'random(600, 850)',
          // 向上发射，减去大炮当前的旋转角度
          angle: () => 270 - gsap.getProperty(cannon, 'rotation'),
          gravity: 600
        },
        stagger: { amount: tl1Time }
      },
      0
    ) // 和透明度变化同时开始

  // 4. 合并主时间线
  masterTl = gsap.timeline({ paused: true }).add(tl1, 0).add(tl2, 0).play()

  // 5. 点击屏幕重新播放
  clickHandler = () => {
    if (masterTl) {
      // 每次重新发射前，清空旧彩带回到原位
      gsap.set(bullets, { opacity: 0, x: 0, y: 0, rotation: 0 })
      masterTl.restart()
    }
  }
  wrapperRef.value.addEventListener('click', clickHandler)
})

onUnmounted(() => {
  if (masterTl) masterTl.kill()
  if (clickHandler && wrapperRef.value) {
    wrapperRef.value.removeEventListener('click', clickHandler)
  }
})
</script>

<template>
  <div ref="wrapperRef" class="cannon-wrapper">
    <h4 class="cannon-hint">点击这里开炮！</h4>

    <div class="cannon-stage">
      <!-- 大炮主体 -->
      <div ref="cannonRef" class="cannon">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 90 L70 90 L60 50 L40 50 Z" fill="#4B5563" />
          <rect x="20" y="40" width="60" height="15" rx="5" fill="#9CA3AF" />
          <circle cx="50" cy="65" r="15" fill="#374151" />
        </svg>
      </div>
      <!-- 彩带容器 -->
      <div ref="bulletsContainerRef" class="bullets-container" />
    </div>
  </div>
</template>

<style scoped>
.cannon-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background: #0e100f;
  border-radius: 12px;
  overflow: hidden;
  cursor: crosshair;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.cannon-hint {
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  color: #7c7c6f;
  font-size: 0.9rem;
  pointer-events: none;
}

.cannon-stage {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.cannon {
  width: 100px;
  height: 100px;
  transform-origin: 50% 80%; /* 旋转中心放在炮台底部 */
  position: relative;
  z-index: 10;
}

.bullets-container {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  z-index: 5;
}
</style>
