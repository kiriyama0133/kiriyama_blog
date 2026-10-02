<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { computed, ref, onMounted } from 'vue'

const pathD = `
  M 30 10
  C 55 30, 55 70, 30 90
  C 5 110, 5 150, 30 170
  C 55 190, 55 230, 30 250
  C 5 270, 5 310, 30 330
  C 55 350, 55 390, 30 390
`

const trackRef = ref<SVGPathElement | null>(null)
const pathLength = ref(0)
const { y } = useWindowScroll()

const scrollProgress = computed(() => {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
  if (scrollHeight <= 0) return 0
  return Math.min(1, y.value / scrollHeight)
})

onMounted(() => {
  if (trackRef.value) {
    pathLength.value = trackRef.value.getTotalLength()
  }
})

const thumbStyle = computed(() => ({
  strokeDasharray: pathLength.value,
  strokeDashoffset: pathLength.value * (1 - scrollProgress.value)
}))
</script>

<template>
  <div class="right-tab">
    <div class="flex flex-wrap h-30">
      <svg width="20" height="100%" viewBox="0 0 60 400">
        <path
          ref="trackRef"
          :d="pathD"
          fill="none"
          class="track"
        />
        <path
          :d="pathD"
          fill="none"
          class="thumb"
          :style="thumbStyle"
        />
      </svg>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.track {
  stroke: #0f1522;
  stroke-width: 12px;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.thumb {
  stroke: #c8ee8c9f;
  stroke-width: 12px;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: stroke-dashoffset 0.1s ease-out;
}
</style>