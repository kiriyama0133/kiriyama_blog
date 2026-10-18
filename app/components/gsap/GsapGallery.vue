<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
gsap.registerPlugin(Flip)

// 直接写死数据，不依赖任何外部传参
const items = [
  {
    title: 'Hoop',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#0ae448',
    type: 'circle'
  },
  {
    title: 'Cone',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#fec5fb',
    type: 'triangle'
  },
  {
    title: 'Combo',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#00bae2',
    type: 'rect'
  },
  {
    title: 'Star',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#ff8709',
    type: 'star'
  },
  {
    title: 'Sparkle',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#9d95ff',
    type: 'diamond'
  },
  {
    title: 'Squish',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#abff84',
    type: 'hexagon'
  },
  {
    title: 'Spiral',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#0ae448',
    type: 'circle'
  },
  {
    title: 'Tunnel',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#fec5fb',
    type: 'triangle'
  },
  {
    title: 'Lock',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#00bae2',
    type: 'rect'
  },
  {
    title: 'Windmill',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#ff8709',
    type: 'star'
  },
  {
    title: 'Triangle',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#9d95ff',
    type: 'diamond'
  },
  {
    title: 'Hoop',
    secondary: 'Lorem ipsum dolor sit amet.',
    text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.',
    color: '#abff84',
    type: 'hexagon'
  }
]

const appRef = ref(null)
const galleryRef = ref(null)
const detailRef = ref(null)
const detailImgRef = ref(null)
const detailContentRef = ref(null)
const textRefs = {
  title: ref(null),
  secondary: ref(null),
  description: ref(null)
}

const activeItem = ref(null)
const isOpen = ref(false)
const activeData = ref({ title: '', color: '', type: '' })

function getSvg(color, type) {
  const paths = {
    circle: `<circle cx="50" cy="50" r="40" stroke="${color}" stroke-width="8"/>`,
    rect: `<rect x="15" y="15" width="70" height="70" rx="8" stroke="${color}" stroke-width="8"/>`,
    triangle: `<path d="M50 15 L85 80 L15 80 Z" stroke="${color}" stroke-width="8" stroke-linejoin="round"/>`,
    star: `<path d="M50 10 L61 40 L93 40 L67 58 L77 90 L50 70 L23 90 L33 58 L7 40 L39 40 Z" stroke="${color}" stroke-width="6" stroke-linejoin="round"/>`,
    diamond: `<path d="M50 10 L90 50 L50 90 L10 50 Z" stroke="${color}" stroke-width="8" stroke-linejoin="round"/>`,
    hexagon: `<path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" stroke="${color}" stroke-width="8" stroke-linejoin="round"/>`
  }
  return `<svg viewBox="0 0 100 100" fill="none">${paths[type] || paths.circle}</svg>`
}

onMounted(async () => {
  await nextTick()
  if (!detailContentRef.value) return

  gsap.set(detailContentRef.value, { yPercent: -100 })
  gsap.set(detailRef.value, { visibility: 'hidden' })

  gsap.to(appRef.value, { autoAlpha: 1, duration: 0.2 })
  gsap.from(galleryRef.value.querySelectorAll('.item'), {
    autoAlpha: 0,
    yPercent: 30,
    stagger: 0.04
  })
})

onUnmounted(() => {
  gsap.killTweensOf('*')
})

function showDetails(item, index) {
  if (activeItem.value) return hideDetails()

  const data = items[index]
  activeData.value = data

  textRefs.title.value.innerText = data.title
  textRefs.secondary.value.innerText = data.secondary
  textRefs.description.value.innerText = data.text

  activeItem.value = item
  isOpen.value = true

  nextTick(() => {
    const detail = detailRef.value
    const img = detailImgRef.value
    const content = detailContentRef.value
    const itemEls = galleryRef.value.querySelectorAll('.item')

    Flip.fit(detail, item, { scale: true, fitChild: img })
    const state = Flip.getState(detail)

    gsap.set(detail, { clearProps: true })
    gsap.set(detail, {
      xPercent: -50,
      top: '50%',
      left: '50%',
      yPercent: -50,
      visibility: 'visible',
      overflow: 'hidden'
    })

    Flip.from(state, {
      duration: 0.5,
      ease: 'power2.inOut',
      scale: true,
      onComplete: () => gsap.set(detail, { overflow: 'auto' })
    }).to(content, { yPercent: 0 }, 0.2)

    gsap
      .to(itemEls, {
        opacity: 0.3,
        stagger: { amount: 0.7, from: itemEls.indexOf(item), grid: 'auto' }
      })
      .kill(item)
  })
}

function hideDetails() {
  if (!isOpen.value) return
  isOpen.value = false

  const detail = detailRef.value
  const content = detailContentRef.value
  const img = detailImgRef.value
  const itemEls = galleryRef.value.querySelectorAll('.item')
  const currentItem = activeItem.value

  if (!detail || !currentItem) {
    if (detail) gsap.set(detail, { visibility: 'hidden' })
    return
  }

  gsap.set(detail, { overflow: 'hidden' })
  const state = Flip.getState(detail)
  Flip.fit(detail, currentItem, { scale: true, fitChild: img })

  const tl = gsap.timeline({
    onComplete: () => {
      activeItem.value = null
      gsap.set(detail, { visibility: 'hidden' })
    }
  })

  tl.to(content, { yPercent: -100 }).to(
    itemEls,
    { opacity: 1, stagger: { amount: 0.7, from: itemEls.indexOf(currentItem), grid: 'auto' } },
    '<'
  )

  Flip.from(state, {
    scale: true,
    duration: 0.5,
    delay: 0.2,
    onInterrupt: () => tl.kill()
  })
}
</script>

<template>
  <div class="gallery-root">
    <div ref="appRef" class="app">
      <div ref="galleryRef" class="gallery">
        <div
          v-for="(item, i) in items"
          :key="i"
          class="item"
          @click.stop="showDetails($event.currentTarget, i)"
        >
          <div class="item-svg" v-html="getSvg(item.color, item.type)" />
        </div>
      </div>
    </div>

    <div v-if="isOpen" class="backdrop" @click.self="hideDetails">
      <div ref="detailRef" class="detail">
        <div
          ref="detailImgRef"
          class="detail-svg"
          @click="hideDetails"
          v-html="getSvg(activeData.color, activeData.type)"
        />
        <div ref="detailContentRef" class="content">
          <div :ref="(el) => (textRefs.title.value = el)" class="title" />
          <div :ref="(el) => (textRefs.secondary.value = el)" class="secondary" />
          <div :ref="(el) => (textRefs.description.value = el)" class="description" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gallery-root {
  position: relative;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.app {
  height: 90vmin;
  width: 90vmin;
  background: var(--color-just-black, #0e100f);
  position: relative;
  overflow: auto;
  color-scheme: dark;
  visibility: hidden;
  margin: 0 auto;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 10px;
}
.item {
  cursor: pointer;
}

.item-svg,
.detail-svg {
  width: 100%;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1c1d1f;
  padding: 12%;
  box-sizing: border-box;
}
.item-svg {
  border-radius: 10px;
}
.detail-svg {
  border-radius: 10px 10px 0 0;
  position: relative;
  z-index: 1;
  cursor: pointer;
}

.item-svg :deep(svg),
.detail-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

.detail {
  width: 90.1vmin;
  display: flex;
  flex-direction: column;
  visibility: hidden;
  max-height: 90vh;
  overflow: auto;
}

.detail .content {
  background: #232323;
  padding: 2rem 1.5rem;
  flex-grow: 1;
}
.detail .content > * {
  margin-bottom: 1rem;
}
.detail .title {
  font-size: 2rem;
  text-transform: uppercase;
  color: #fffce1;
}
.detail .secondary {
  color: lightgray;
}
.detail .description {
  line-height: 1.5;
  color: #bbbaa6;
}
</style>
