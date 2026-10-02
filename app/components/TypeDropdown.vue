<!--
  TypeDropdown —— 按文档 type 筛选的下拉框（多选）

  · 类型列表与计数都来自 store（store.types / store.typeCounts）
  · 选中态直接写进 store.activeTypes，页面只需要读 store.filteredSummaries
  · 配色：面板底色取暖橄榄「邻近色」(--color-light-menu)，
    选中态借用与暖色「互补」的冷紫 (--color-light-primary)，
    整条筛选栏只有这一处重音。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { onKeyStroke, onClickOutside } from '@vueuse/core'
import { useContentStore } from '~/stores/content'

const store = useContentStore()

const root = ref<HTMLElement | null>(null)
const open = ref(false)

onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

/** 一个都没选 = 看全部 */
const allActive = computed(() => store.activeTypes.length === 0)

const label = computed(() => {
  const picked = store.activeTypes
  if (!picked.length) return '全部类型'
  if (picked.length === 1) return picked[0]!
  return `${picked.length} 个类型`
})

/** 未选中时才挂 hover 底色，避免把选中态的紫色盖掉 */
function itemClass(on: boolean) {
  return on
    ? 'bg-light-primary text-light-font-h font-semibold'
    : 'text-light-font-p hover:bg-light-menu-hover'
}

function boxClass(on: boolean) {
  return on
    ? 'border-light-primary bg-light-primary text-light-font-h'
    : 'border-light-menu-border text-transparent'
}

function selectAll() {
  store.clearTypes()
  open.value = false
}
</script>

<template>
  <div ref="root" class="dropdown relative shrink-0">
    <button
      type="button"
      class="trigger flex h-10 cursor-pointer items-center gap-2 rounded-2xl border px-3 text-[13px] transition-all"
      :class="allActive
        ? 'border-light-menu-border bg-light-menu text-light-font-p hover:bg-light-menu-hover'
        : 'border-light-primary bg-light-primary font-semibold text-light-font-h'"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="open = !open"
    >
      <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M2 4h12M4.5 8h7M7 12h2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>

      <span class="label max-w-28 truncate">{{ label }}</span>

      <svg
        class="caret h-3 w-3 shrink-0 transition-transform"
        :class="{ 'caret--open': open }"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path
          d="M2 4.5 6 8.5 10 4.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <Transition name="td">
      <div
        v-if="open"
        class="panel absolute left-0 top-full z-50 mt-1.5 w-52 rounded-2xl border border-light-menu-border bg-light-menu p-1.5 shadow-lg"
        role="listbox"
        aria-multiselectable="true"
        aria-label="按类型筛选"
      >
        <button
          type="button"
          class="item"
          :class="itemClass(allActive)"
          @click="selectAll"
        >
          <span class="box" :class="boxClass(allActive)" aria-hidden="true">✓</span>
          <span class="flex-1 text-left">全部类型</span>
          <span class="count text-light-accent">{{ store.totalCount }}</span>
        </button>

        <div class="my-1 h-px bg-light-menu-border" />

        <button
          v-for="type in store.types"
          :key="type"
          type="button"
          class="item"
          role="option"
          :aria-selected="store.isTypeActive(type)"
          :class="itemClass(store.isTypeActive(type))"
          @click="store.toggleType(type)"
        >
          <span class="box" :class="boxClass(store.isTypeActive(type))" aria-hidden="true">✓</span>
          <span class="flex-1 truncate text-left">{{ type }}</span>
          <span class="count text-light-accent">{{ store.typeCounts[type] ?? 0 }}</span>
        </button>

        <p v-if="!store.types.length" class="px-2 py-1.5 text-[12px] text-light-font">
          还没有可筛选的类型
        </p>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.caret--open {
  transform: rotate(180deg);
}

// 窄屏收成纯图标，跟 Search 的响应式行为对齐
@media (width < 640px) {
  .label {
    display: none;
  }
}

.item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.75rem;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.18s, color 0.18s;
}

.box {
  display: grid;
  flex: none;
  place-items: center;
  width: 1rem;
  height: 1rem;
  border-width: 1px;
  border-style: solid;
  border-radius: 0.375rem;
  font-size: 10px;
  line-height: 1;
  transition: all 0.18s;
}

.count {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.td-enter-active,
.td-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.td-enter-from,
.td-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
