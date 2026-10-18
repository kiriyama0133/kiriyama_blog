<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { Draggable } from 'gsap/Draggable'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 注册所有需要的插件
gsap.registerPlugin(SplitText, Draggable, Flip, ScrollTrigger)

const props = defineProps({
  animation: { type: String, default: 'fade' },
  duration: { type: [Number, String], default: 0.8 },
  delay: { type: [Number, String], default: 0 },
  ease: { type: String, default: 'power2.out' },
  // 新增 trigger 属性，默认为 'auto'（加载即播放），传 'scroll' 则滚动触发
  trigger: { type: String, default: 'auto' },
  // 新增 start 属性，控制滚动触发的位置
  start: { type: String, default: 'top 85%' }
})

const containerRef = ref(null)
let tl = null
let split = null
let draggable = null
const isPlaying = ref(false)
const isHorizontal = ref(false)
let flipState = null
let swapSelection = null

onMounted(async () => {
  await nextTick()
  const target = containerRef.value?.querySelector('.animate-target')
  if (!target) return

  const duration = Number(props.duration) || 0.8
  const delay = Number(props.delay) || 0
  const ease = props.ease || 'power2.out'

  tl = gsap.timeline({
    paused: true,
    onComplete: () => {
      isPlaying.value = false
    }
  })

  switch (props.animation) {
    case 'fade':
      tl.from(target, { opacity: 0, y: 30, duration, delay, ease })
      break
    case 'slide':
      tl.from(target, { x: -60, opacity: 0, duration, delay, ease })
      break
    case 'scale':
      tl.from(target, { scale: 0.8, opacity: 0, duration, delay, ease: 'back.out(1.7)' })
      break
    case 'chars':
      split = new SplitText(target, { type: 'chars' })
      tl.from(split.chars, {
        y: 40,
        opacity: 0,
        duration: duration * 0.6,
        stagger: 0.03,
        delay,
        ease
      })
      break
    case 'rotate':
      tl.from(target, { rotation: -15, opacity: 0, duration, delay, ease })
      break
    case 'stagger':
      tl.from(target.querySelectorAll('.nav-item'), {
        x: -50,
        opacity: 0,
        duration,
        stagger: 0.1,
        ease
      })
      break
    case 'flip': {
      const list = target.querySelector('.nav-list')
      if (list) {
        list.style.display = 'flex'
        list.style.flexDirection = 'column'
        list.style.gap = '4px'
      }
      isPlaying.value = true
      return
    }
    case 'drag':
      draggable = Draggable.create(target, {
        type: 'x,y',
        bounds: containerRef.value,
        inertia: false
      })
      isPlaying.value = true
      return
    case 'swap': {
      const items = target.querySelectorAll('.swap-item')
      items.forEach((item) => {
        if (!item.dataset.flipId) {
          item.dataset.flipId = 'swap-' + Math.random().toString(36).slice(2, 8)
        }
        item.addEventListener('click', handleSwapClick)
      })
      isPlaying.value = true
      return
    }
    default:
      tl.from(target, { opacity: 0, y: 30, duration, delay, ease })
  }

  // --- 关键改动：根据 trigger 决定如何播放 ---
  if (props.trigger === 'scroll') {
    // 配置 ScrollTrigger
    tl.scrollTrigger = {
      trigger: containerRef.value, // 以盒子本身作为触发点
      start: props.start, // 默认滚动到 85% 视口高度时触发
      toggleActions: 'play none none none' // 向下滚动进入视口时播放，离开不重置
      // 如果是希望“滚动到哪动画播到哪”，可以改成 scrub: true
    }
    tl.play() // 虽然上面写了 paused: true，但加上 scrollTrigger 后 GSAP 会自动接管控制权
  } else {
    // 默认行为：加载即播放
    tl.play()
  }

  isPlaying.value = true
})

// --- 下面的交互逻辑（swap, flip, 播放控制）保持不变 ---
function handleSwapClick(e) {
  const item = e.target.closest('.swap-item')
  if (!item) return

  if (!swapSelection) {
    swapSelection = item
    gsap.to(item, { scale: 1.05, duration: 0.2 })
    item.style.outline = '2px solid #6366f1'
    return
  }

  if (swapSelection === item) {
    gsap.to(item, { scale: 1, duration: 0.2 })
    item.style.outline = ''
    swapSelection = null
    return
  }

  const first = swapSelection
  const second = item
  const target = containerRef.value.querySelector('.animate-target')
  const items = target.querySelectorAll('.swap-item')
  const state = Flip.getState(items)

  const parent = first.parentNode
  const placeholder = document.createElement('div')
  parent.insertBefore(placeholder, first)
  parent.insertBefore(first, second)
  parent.insertBefore(second, placeholder)
  parent.removeChild(placeholder)

  const parentHeight = target.offsetHeight
  target.style.height = `${parentHeight}px`

  Flip.from(state, {
    duration: 0.6,
    ease: 'power2.inOut',
    absolute: true,
    scale: true,
    stagger: 0.02,
    onComplete: () => {
      target.style.height = ''
    }
  })

  gsap.to([first, second], { scale: 1, duration: 0.2 })
  first.style.outline = ''
  second.style.outline = ''
  swapSelection = null
}

function toggleFlipLayout() {
  const target = containerRef.value?.querySelector('.animate-target')
  const items = target?.querySelectorAll('.nav-item')
  const list = target?.querySelector('.nav-list')
  if (!items?.length || !list) return

  flipState = Flip.getState(items)
  isHorizontal.value = !isHorizontal.value
  list.style.flexDirection = isHorizontal.value ? 'row' : 'column'
  list.style.flexWrap = isHorizontal.value ? 'wrap' : 'nowrap'

  Flip.from(flipState, {
    duration: 0.6,
    ease: 'power2.inOut',
    stagger: 0.05,
    absolute: true
  })
}

function play() {
  if (!tl) return
  if (tl.progress() === 1) tl.restart()
  else tl.play()
  isPlaying.value = true
}

function pause() {
  if (!tl) return
  tl.pause()
  isPlaying.value = false
}

function restart() {
  if (!tl) return
  tl.restart()
  isPlaying.value = true
}

onUnmounted(() => {
  tl?.kill()
  // 必须销毁 ScrollTrigger 实例，否则会造成内存泄漏和滚动错乱
  ScrollTrigger.getAll().forEach((t) => {
    if (t.vars.trigger === containerRef.value) t.kill()
  })
  tl = null
  split?.revert()
  split = null
  draggable?.forEach((d) => d.kill())
  draggable = null
  const items = containerRef.value?.querySelectorAll('.swap-item')
  items?.forEach((item) => item.removeEventListener('click', handleSwapClick))
  swapSelection = null
})
</script>

<template>
  <div ref="containerRef" class="gsap-box">
    <!-- 如果是滚动触发，为了不干扰页面滚动，隐藏播放控制按钮 -->
    <div v-if="trigger !== 'scroll'" class="gsap-controls">
      <template v-if="animation === 'flip'">
        <button title="切换布局" @click="toggleFlipLayout">⇄</button>
      </template>
      <template v-else-if="animation === 'swap'">
        <span style="font-size: 0.7rem; color: #888">点击两项交换</span>
      </template>
      <template v-else-if="animation !== 'drag'">
        <button :disabled="isPlaying" title="播放" @click="play">▶</button>
        <button :disabled="!isPlaying" title="暂停" @click="pause">⏸</button>
        <button title="重播" @click="restart">⟲</button>
      </template>
    </div>

    <div class="animate-target">
      <slot />
    </div>
  </div>
</template>

<style scoped>
/* 样式保持不变，这里省略以防太长 */
.gsap-box {
  position: relative;
  border: 1px solid var(--ui-line, #e2e2e3);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  background: var(--ui-backdrop, #f6f6f7);
  transition: height 0.1s;
}
.gsap-controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 10;
}
.gsap-controls button {
  font-size: 0.75rem;
  line-height: 1;
  padding: 0.3rem 0.45rem;
  border: 1px solid var(--ui-line, #e2e2e3);
  border-radius: 4px;
  background: var(--ui-surface);
  cursor: pointer;
  transition: background 0.15s;
}
.gsap-controls button:hover:not(:disabled) {
  background: var(--ui-backdrop);
}
.gsap-controls button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
