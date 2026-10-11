<!--
  ProsePre 覆写（@nuxtjs/mdc 的默认实现就是 <pre :class><slot /></pre>，
  高亮在 AST 阶段已经完成，slot 里就是高亮后的节点）：
  - ```mermaid 代码块 → MermaidBlock，客户端渲染成 SVG
  - 其余语言 → 和默认实现完全一致
-->
<script setup lang="ts">
defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  meta?: string
  class?: string
}>()
</script>

<template>
  <MermaidBlock v-if="language === 'mermaid'" :code="code ?? ''" />
  <pre v-else :class="$props.class"><slot /></pre>
</template>
