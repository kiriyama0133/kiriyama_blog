<!--
  ProsePre 覆写（@nuxtjs/mdc 的默认实现就是 <pre :class><slot /></pre>，
  高亮在 AST 阶段已经完成，slot 里就是高亮后的节点）：
  - ```mermaid 代码块 → MermaidBlock，客户端渲染成 SVG
  - 可运行语言（html/ts/js/csharp/c/cpp）→ 右上角提供打开 Playground Dialog 的 SVG 图标按钮
  - 其余语言 → 和默认实现完全一致
-->
<script setup lang="ts">
import { computed } from 'vue'
import { isRunnableLanguage, usePlayground } from '~/composables/usePlayground'
import playIcon from '~/assets/image/play-svgrepo-com.svg'

const props = defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  meta?: string
  class?: string
}>()

const { t } = useI18n()
const { openPlayground } = usePlayground()

const canRun = computed(() => isRunnableLanguage(props.language) && Boolean(props.code?.trim()))

const playIconStyle = {
  '-webkit-mask-image': `url("${playIcon}")`,
  'mask-image': `url("${playIcon}")`
}

function handleOpenPlayground() {
  if (!props.code) return
  openPlayground({
    code: props.code,
    language: props.language,
    filename: props.filename
  })
}
</script>

<template>
  <MermaidBlock v-if="language === 'mermaid'" :code="code ?? ''" />
  <div v-else-if="canRun" class="prose-pre-wrap">
    <button
      type="button"
      class="prose-pre-run-btn"
      :title="t('playground.openInPlayground')"
      :aria-label="t('playground.openInPlayground')"
      @click="handleOpenPlayground"
    >
      <span class="prose-pre-run-btn__icon" :style="playIconStyle" aria-hidden="true" />
      <span class="prose-pre-run-btn__label">{{ t('playground.run') }}</span>
    </button>
    <pre :class="$props.class"><slot /></pre>
  </div>
  <pre v-else :class="$props.class"><slot /></pre>
</template>

<style lang="scss" scoped>
.prose-pre-wrap {
  position: relative;

  &:hover .prose-pre-run-btn,
  &:focus-within .prose-pre-run-btn {
    opacity: 1;
  }
}

.prose-pre-run-btn {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  height: 1.85rem;
  padding: 0 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-line);
  background-color: var(--ui-canvas);
  color: var(--ui-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.85;
  transition:
    opacity 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;

  &:hover {
    opacity: 1;
    color: var(--ui-text-strong);
    background-color: var(--ui-btn-hover);
    border-color: var(--ui-accent);
  }
}

.prose-pre-run-btn__icon {
  display: inline-block;
  flex-shrink: 0;
  width: 0.875rem;
  height: 0.875rem;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}
</style>
