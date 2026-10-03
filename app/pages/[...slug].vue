<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TocTree } from '~/stores/reader'
import { useReaderStore } from '~/stores/reader'
import { pageTitle } from '~/utils/site'
import { canonicalPath } from '~/utils/path'

const route = useRoute()
const reader = useReaderStore()

// 内容库里的 path 是解码原文且无尾斜杠，route.path 可能两者都不是
const contentPath = canonicalPath(route.path)

const { data: page } = await useAsyncData('page-' + contentPath, () => {
  return queryCollection('content').path(contentPath).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

interface Article {
  title?: string
  description?: string
  body?: { toc?: TocTree; value?: unknown[] }
}

const article = computed(() => (page.value ?? null) as unknown as Article | null)

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
      <ContentRenderer :value="page" />
    </div>
  </div>
</template>
