<script setup lang="ts">
import { computed, watch } from 'vue'
import type { TocTree } from '~/stores/reader'
import { useReaderStore } from '~/stores/reader'
import { pageTitle } from '~/utils/site'

const route = useRoute()
const reader = useReaderStore()

const { data: page } = await useAsyncData('page-' + route.path, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

/**
 * 笔记本体。title / description 都是 nuxt/content 给出来的：
 * frontmatter 里没写时，title 用文件名兜底、description 用首段正文兜底。
 */
interface Article {
  title?: string
  description?: string
  body?: { toc?: TocTree; value?: unknown[] }
}

const article = computed(() => (page.value ?? null) as unknown as Article | null)

/** 正文第一个元素节点是不是 h1 —— 是就不再重复渲染一遍标题 */
const hasLeadingH1 = computed(() => {
  const nodes = article.value?.body?.value
  if (!Array.isArray(nodes)) return false
  // 跳过顶层散落的纯文本节点，取第一个真正的元素节点
  const first = nodes.find((node) => Array.isArray(node) && typeof node[0] === 'string')
  return Array.isArray(first) && first[0] === 'h1'
})

const showTitle = computed(() => !!article.value?.title && !hasLeadingH1.value)

/**
 * 页面名称 / 描述全部取自这篇笔记。
 *
 * 为什么不能写在 definePageMeta 里：它是个**编译期宏**，参数只能是静态字面量
 * （所以那里目前只能放 layout），而这里的数据是 await 查库拿到的运行时值，
 * 只能交给 useSeoMeta —— 用 getter 形式，切换文档时 head 会跟着自动更新。
 */
useSeoMeta({
  title: () => pageTitle(article.value?.title),
  description: () => article.value?.description || undefined,
  ogTitle: () => article.value?.title || undefined,
  ogDescription: () => article.value?.description || undefined,
  ogType: 'article'
})

/**
 * 把 nuxt/content 解析出的 `page.body.toc`（就是 ## 那些锚点）交给 reader store，
 * 由 slug-layout 里的 TocFanNav 消费 —— page 与 layout 没有父子链路，只能走 store。
 */
watch(
  article,
  (value) => {
    reader.setArticle({
      path: route.path,
      title: value?.title,
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
    <div v-if="page" class="markdown-body">
      <!-- 有些笔记（如 Vue/axios.md）正文里没写 h1，拿笔记 title 补一个，页面才不至于「没有名字」 -->
      <h1 v-if="showTitle" class="doc-title">{{ article?.title }}</h1>
      <ContentRenderer :value="page" />
    </div>
  </div>
</template>
