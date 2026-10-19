<template>
  <Teleport to="body">
    <Transition name="dlg">
      <div v-if="isOpen" class="overlay" role="dialog" aria-modal="true" @click="closeDialog">
        <div class="dialog" :class="panelClass" @click.stop>
          <slot :close="closeDialog" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { onKeyStroke } from '@vueuse/core'

const props = defineProps<{
  modelValue: boolean
  /** 子组件可覆盖或追加弹窗面板样式（如 Playground 的宽屏双栏尺寸） */
  panelClass?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const closeDialog = () => {
  isOpen.value = false
}

onKeyStroke('Escape', () => {
  if (isOpen.value) closeDialog()
})
</script>

<style lang="scss" scoped>
.dialog {
  /* 默认尺寸与内边距，子组件可通过 panelClass 定制 */
  width: min(620px, 92vw);
  max-height: 88vh;
  overflow-y: auto;
  padding: 28px 24px;
  color: var(--ui-text);
  background: var(--ui-backdrop);
  border-radius: 8px;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.dlg-enter-active,
.dlg-leave-active {
  transition: opacity 0.18s ease;

  .dialog {
    transition:
      transform 0.18s ease,
      opacity 0.18s ease;
  }
}

.dlg-enter-from,
.dlg-leave-to {
  opacity: 0;

  .dialog {
    opacity: 0;
    transform: scale(0.97) translateY(6px);
  }
}
</style>
