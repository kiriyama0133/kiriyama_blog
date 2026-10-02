<script setup lang="ts">
import { watch } from 'vue'
import type { TocTree } from '~/stores/reader'
import { useReaderStore } from '~/stores/reader'

const route = useRoute()
const reader = useReaderStore()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

/**
 * 把 nuxt/content 解析出的 `page.body.toc`（就是 ## 那些锚点）交给 reader store，
 * 由 slug-layout 里的 TocFanNav 消费 —— page 与 layout 没有父子链路，只能走 store。
 */
watch(
  page,
  (value) => {
    const doc = value as unknown as { title?: string; body?: { toc?: TocTree } } | null
    reader.setArticle({
      path: route.path,
      title: doc?.title,
      toc: doc?.body?.toc ?? null,
    })
  },
  { immediate: true },
)

definePageMeta(
  {
    layout: 'slug-layout',
  }
)
</script>

<template>
  <div class="container p-8">
    <div v-if="page" class="markdown-body">
      <ContentRenderer :value="page" />
    </div>
  </div>
</template>
