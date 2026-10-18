<script setup>
import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
gsap.registerPlugin(ScrambleTextPlugin)

const scrambleRef = ref(null)

onMounted(() => {
  gsap.to(scrambleRef.value, {
    duration: 2,
    scrambleText: {
      text: 'Hello Nuxt + GSAP',
      chars: 'XO01', // 乱码字符集，你可以换成汉字或其他符号
      revealDelay: 0.5, // 延迟多久开始真正揭示
      speed: 0.3 // 变换速度
    }
  })
})
</script>

<template>
  <div class="scramble-box">
    <span ref="scrambleRef">Initial Text</span>
  </div>
</template>
