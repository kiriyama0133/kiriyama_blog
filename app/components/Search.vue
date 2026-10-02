<template>
    <div class="search-container">
        <div class="search flex h-10 items-center gap-2 rounded-2xl bg-light-search p-2 shadow-sm transition-all duration-300 focus-within:shadow-xl">
            <span
              class="search-icon shrink-0"
              :class="{ 'is-wrong': noResults }"
              :style="iconStyle"
              role="img"
              :aria-label="noResults ? '未找到匹配内容' : '搜索'"
            ></span>
            <input
              v-model="store.keyword"
              class="search_input"
              type="search"
              placeholder="搜索文档…"
              aria-label="搜索文档"
            >
            <!-- 防抖等待中：输入已经变了，结果还没跟上 -->
            <span v-if="store.searching" class="dots shrink-0 text-light-font-h" aria-hidden="true">···</span>
            <button
              v-if="store.keyword"
              type="button"
              class="clear shrink-0 text-light-font-h hover:bg-light-button-hover"
              aria-label="清空搜索"
              @click="store.clearKeyword()"
            >×</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import searchRight from '~/assets/image/glass-loupe-magnifying-2-svgrepo-com.svg'
import searchWrong from '~/assets/image/glass-loupe-magnifying-svgrepo-com.svg'
import { computed } from 'vue'
import { useContentStore } from '~/stores/content'

const store = useContentStore()

// 有关键词、防抖已结束、且一条都没匹配上 → 搜索落空
const noResults = computed(() =>
  store.debouncedKeyword.trim().length > 0
  && !store.searching
  && store.filteredCount === 0,
)

// 用 mask 渲染 SVG，这样颜色（含红色失败态）完全可控
const iconStyle = computed(() => {
  const url = noResults.value ? searchWrong : searchRight
  return {
    '-webkit-mask-image': `url("${url}")`,
    'mask-image': `url("${url}")`,
  }
})
</script>

<style lang="scss" scoped>
.search-container {
    flex: 1;
    min-width: 0;
}
.search-icon {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    background-color: var(--color-light-font-h);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
    -webkit-mask-size: contain;
    mask-size: contain;
    transition: background-color 0.2s ease;
}
.search-icon.is-wrong {
    background-color: #e5484d;
}
.search_input {
    height: 100%;
    width: 100%;
    min-width: 0;
    background-color: transparent;

    // 去掉 type="search" 原生的清除按钮，只留自定义的 .clear
    appearance: none;
    &::-webkit-search-cancel-button,
    &::-webkit-search-decoration {
        display: none;
    }

    &:focus {
        border: none;
        outline: none;
    }
}
.dots {
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    animation: dots-pulse 1s ease-in-out infinite;
}
.clear {
    display: grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    border: none;
    border-radius: 999px;
    background-color: transparent;
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.18s;
}
@keyframes dots-pulse {
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
}
</style>
