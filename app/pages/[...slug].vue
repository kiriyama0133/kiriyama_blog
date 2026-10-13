<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TocTree } from '~/stores/reader'
import { useReaderStore } from '~/stores/reader'
import { useSiteMeta } from '~/composables/useSiteMeta'
import { canonicalPath } from '~/utils/path'
import { formatNoteDate } from '~/utils/date'

const route = useRoute()
const reader = useReaderStore()
const { pageTitle } = useSiteMeta()

// 内容库里的 path 是解码原文且无尾斜杠，route.path 可能两者都不是
const contentPath = canonicalPath(route.path)

const { data: page } = await useAsyncData('page-' + contentPath, () =>
  queryCollection('content').path(contentPath).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

interface Article {
  title?: string
  description?: string
  /** frontmatter 原样：date / tags 都存在这一列里（表里没有独立列） */
  meta?: { date?: unknown; tags?: string[] }
  body?: { toc?: TocTree; value?: unknown[] }
}

const article = computed(() => (page.value ?? null) as unknown as Article | null)

/** `YYYY-MM-DD`；没写 frontmatter date 就是空串，模板据此整块不渲染 */
const date = computed(() => formatNoteDate(article.value?.meta?.date))

const hasLeadingH1 = computed(() => {
  const nodes = article.value?.body?.value
  if (!Array.isArray(nodes)) return false
  const first = nodes.find((node) => Array.isArray(node) && typeof node[0] === 'string')
  return Array.isArray(first) && first[0] === 'h1'
})

const showTitle = computed(() => !!article.value?.title && !hasLeadingH1.value)

useSeoMeta({
  title: () => pageTitle(article.value?.title),
  description: () => article.value?.description || undefined,
  ogTitle: () => article.value?.title || undefined,
  ogDescription: () => article.value?.description || undefined,
  ogType: 'article'
})

watch(
  article,
  (value) => {
    reader.setArticle({
      path: contentPath,
      title: value?.title,
      description: value?.description,
      toc: value?.body?.toc ?? null
    })
  },
  { immediate: true }
)

definePageMeta({
  layout: 'slug-layout'
})
</script>

<template>
  <div class="container p-8">
    <div v-if="page" class="markdown-body mt-10">
      <h1 v-if="showTitle" class="doc-title">{{ article?.title }}</h1>
      <time v-if="date" class="doc-date" :datetime="date">{{ date }}</time>
      <ContentRenderer :value="page" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 标题下方的时间行
.doc-date {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--ui-text-muted);
}

.doc-date + :deep(h1) {
  margin-top: 0.5rem;
}
</style>
