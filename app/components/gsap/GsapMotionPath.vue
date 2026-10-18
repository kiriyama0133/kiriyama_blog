<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

const containerRef = ref(null)
let tl = null

onMounted(async () => {
  await nextTick()
  if (!containerRef.value) return

  const items = containerRef.value.querySelectorAll('.fly-item')

  // 1. 暴力定位：让所有元素初始的绝对坐标在起点（右侧 600, 50）
  gsap.set(items, {
    opacity: 0,
    x: 600,
    y: 50
  })

  // 2. 动态生成隐藏路径
  const pathData = 'M 600, 50 C 300, -100 100, 300 50, 200'

  const hiddenSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  hiddenSvg.setAttribute('width', '0')
  hiddenSvg.setAttribute('height', '0')
  hiddenSvg.style.position = 'absolute'
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('id', 'dynamic-path')
  path.setAttribute('d', pathData)
  hiddenSvg.appendChild(path)
  containerRef.value.appendChild(hiddenSvg)

  // 3. 创建时间线
  tl = gsap.timeline({ paused: true })

  items.forEach((item, index) => {
    const delay = index * 0.4 // 每个间隔 0.4 秒发射

    tl.to(
      item,
      {
        opacity: 1,
        duration: 0.2
      },
      delay
    ).to(
      item,
      {
        duration: 2,
        ease: 'power2.inOut',
        motionPath: {
          path: '#dynamic-path',
          // 注意：这里去掉了 align，直接让元素按绝对坐标走！
          start: 0,
          end: 1
        }
      },
      delay
    )
  })

  tl.play()
})

function replay() {
  if (tl) {
    // 重播时，先瞬间拉回起点
    gsap.set(containerRef.value.querySelectorAll('.fly-item'), { x: 600, y: 50 })
    tl.restart()
  }
}

onUnmounted(() => {
  if (tl) tl.kill()
})
</script>

<template>
  <div ref="containerRef" class="motion-wrapper">
    <button class="replay-btn" @click="replay">⟲ 重播</button>

    <div class="scene">
      <!-- 可见的虚线背景 -->
      <svg class="visible-path" viewBox="0 0 800 300">
        <path
          d="M 600, 50 C 300, -100 100, 300 50, 200"
          fill="none"
          stroke="#333"
          stroke-width="2"
          stroke-dasharray="5,5"
        />
      </svg>

      <div class="marker" style="left: 600px; top: 50px">起点 (右侧)</div>
      <div class="marker" style="left: 50px; top: 200px">终点 (左侧)</div>

      <div class="flying-items">
        <div class="fly-item" style="background: #0ae448; color: #000">Vue</div>
        <div class="fly-item" style="background: #00bae2; color: #fff">Nuxt</div>
        <div class="fly-item" style="background: #ff8709; color: #000">GSAP</div>
        <div class="fly-item" style="background: #9d95ff; color: #fff">CSS</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.motion-wrapper {
  position: relative;
  width: 100%;
  height: 400px;
  background: #0e100f;
  border-radius: 16px;
  border: 1px solid #2a2c30;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.replay-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 99;
  padding: 6px 12px;
  background: #222;
  color: #fff;
  border: 1px solid #555;
  border-radius: 6px;
  cursor: pointer;
}

.scene {
  position: relative;
  width: 800px;
  height: 300px;
  max-width: 100%;
}

.visible-path {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.marker {
  position: absolute;
  font-size: 12px;
  color: #666;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.flying-items {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.fly-item {
  position: absolute;
  top: 0;
  left: 0;
  padding: 6px 16px;
  font-size: 1rem;
  font-weight: bold;
  border-radius: 99px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  will-change: transform;

  /* 关键修复：强制在自身中心点对齐 */
  transform: translate(-50%, -50%);
  margin: 0;
}
</style>
