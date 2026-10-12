<!--
  MermaidBlock —— 把 ```mermaid 代码块渲染成 SVG。
-->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useTheme } from '~/composables/useTheme'

const props = defineProps<{ code: string }>()

const { isDark } = useTheme()
const el = ref<HTMLElement | null>(null)
const failed = ref(false)

type Mermaid = typeof import('mermaid').default
let mermaid: Mermaid | null = null
let seq = 0

async function render() {
  const target = el.value
  if (!target || !props.code.trim()) return
  try {
    mermaid ??= (await import('mermaid')).default
    // 主题跟着全站明暗走；每次 initialize 都生效于下一次 render
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: isDark.value ? 'dark' : 'default'
    })
    // render 要求全局唯一 id（会往 body 塞同名隐藏元素）
    const { svg } = await mermaid.render(`mermaid-${++seq}`, props.code)
    target.innerHTML = svg
    failed.value = false
  } catch (error) {
    // 语法错误等：别把整页弄崩，回退显示源码
    failed.value = true
    console.warn('[mermaid] 渲染失败', error)
  }
}

onMounted(render)
// 切换明暗后重画（mermaid 的主题是渲染期定死的，不是 CSS 变量）
watch(isDark, render)
</script>

<template>
  <pre v-if="failed" class="mermaid-fallback"><code>{{ code }}</code></pre>
  <div v-else ref="el" class="mermaid" />
</template>
