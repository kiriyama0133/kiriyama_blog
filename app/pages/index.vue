<script setup lang="ts">
import type { ContentMeta } from '~/types/markdown'
import { useContentStore } from '~/stores/content'
import BlogCard from '~/components/BlogCard.vue'
import Search from '~/components/Search.vue'
import TypeDropdown from '~/components/TypeDropdown.vue'
import SpinCircle from '~/components/SpinCircle.vue'
import { SITE_DESCRIPTION, pageTitle } from '~/utils/site'

const PAGE_SIZE = 10

const store = useContentStore()

const { data: pages } = await useAsyncData<ContentMeta[]>('pages-list', () =>
  queryCollection('content').select('path', 'title', 'description').order('path', 'ASC').all()
)

watchEffect(() => {
  if (pages.value) {
    store.setDocuments(pages.value)
  }
})

const { sentinel, visibleItems, hasMore, loadingMore, total } = useInfiniteList(
  computed(() => store.filteredSummaries),
  { pageSize: PAGE_SIZE }
)

// 列表页只有站点名，不挂「· 站点名」尾巴
useSeoMeta({
  title: () => pageTitle('全部笔记'),
  description: SITE_DESCRIPTION
})

definePageMeta({
  layout: 'index-layout'
})
</script>

<template>
  <div class="index-page">
    <!-- 固定在顶部：半透明底 + backdrop-blur，卡片从下面滚过时在衔接处被糊掉 -->
    <header class="filter-bar">
      <div class="container filter-bar__inner">
        <TypeDropdown />
        <Search />
      </div>
    </header>

    <div class="container index-body">
      <p class="filter-meta text-light-font dark:text-dark-font">
        <span v-if="store.hasFilters">
          筛选出 {{ store.filteredCount }} / {{ store.totalCount }} 篇
          <button
            type="button"
            class="filter-reset cursor-pointer text-light-accent underline hover:text-light-font-h dark:text-dark-accent dark:hover:text-dark-font-h"
            @click="store.clearFilters()"
          >
            清除筛选
          </button>
        </span>
        <span v-else>共 {{ store.totalCount }} 篇文档</span>
      </p>

      <BlogCard v-for="item in visibleItems" :key="item.path" :path="item.path">
        <template #title>{{ item.title }}</template>
        <template #summary>{{ item.description }}</template>
      </BlogCard>

      <p
        v-if="store.hasFilters && !store.filteredCount"
        class="empty text-light-font dark:text-dark-font"
      >
        没有匹配的文档，换个关键词或类型试试。
      </p>

      <!-- 滚到底的哨兵；加载动画 / 到底提示都挂在这儿 -->
      <div ref="sentinel" class="list-foot">
        <SpinCircle v-if="loadingMore" />
        <span
          v-else-if="!hasMore && total > PAGE_SIZE"
          class="list-foot__end text-light-font dark:text-dark-font"
        >
          没有更多了
        </span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 筛选条总高：上下内边距 0.75rem×2 + 载体高度 h-10(2.5rem)
$filter-bar-h: 4rem;

.filter-bar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  padding-block: 0.75rem;
  /* 半透明底跟着主题翻（main.css 的 --ui-backdrop） */
  background-color: var(--ui-backdrop);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);

  // 衔接处：往下一小段继续磨砂并渐隐，避免出现生硬的横线
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    height: 1.25rem;
    pointer-events: none;
    background: linear-gradient(to bottom, var(--ui-backdrop), transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    -webkit-mask-image: linear-gradient(to bottom, #000, transparent);
    mask-image: linear-gradient(to bottom, #000, transparent);
  }
}

// 用 .container 保证搜索框与下方正文左对齐
.filter-bar__inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

// 给固定条让位
.index-body {
  padding-top: calc(#{$filter-bar-h} + 1.25rem);
}

.filter-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
}

.empty {
  padding: 2rem 0;
  text-align: center;
  font-size: 0.875rem;
}

// 哨兵：始终占位（观察器需要它一直在 DOM 里），居中放 spinner / 到底提示
.list-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.5rem;
  padding: 1rem 0 2rem;
}

.list-foot__end {
  font-size: 0.8125rem;
}
</style>
