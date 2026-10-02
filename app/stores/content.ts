import { defineStore } from 'pinia'
import type { ContentDocument, ContentMeta } from '~/types/markdown'
import { getTypeFromPath } from '~/composables/useContentSummary'
import { filterDocuments, useMarkdownSearch } from '~/composables/markdown'

interface SummaryItem {
  path: string
  title: string
  description: string
  type: string
}

function toSummary(doc: ContentDocument): SummaryItem {
  return {
    path: doc.path,
    title: doc.title || '',
    description: doc.description || '',
    type: doc.type,
  }
}

export const useContentStore = defineStore('content', () => {
  const documents = ref<ContentDocument[]>([])
  const loaded = ref(false)

  const summaries = computed<SummaryItem[]>(() => documents.value.map(toSummary))

  const totalCount = computed(() => documents.value.length)

  /**
   * 关键词搜索（vueuse 防抖）。
   * `keyword` 直接 v-model 给输入框，`debouncedKeyword` 才是真正参与过滤的那个。
   */
  const {
    keyword,
    debouncedKeyword,
    searching,
    results: searchResults,
    search,
    clear: clearKeyword,
  } = useMarkdownSearch(documents)

  /** 全部出现过的 type（去重 + 排序）—— 下拉框用的就是这份 */
  const types = computed(() =>
    [...new Set(documents.value.map(doc => doc.type).filter(Boolean))].sort(),
  )

  /** 每个 type 下的文档数，给下拉框做角标 */
  const typeCounts = computed(() =>
    documents.value.reduce<Record<string, number>>((counts, doc) => {
      counts[doc.type] = (counts[doc.type] ?? 0) + 1
      return counts
    }, {}),
  )

  /** 当前选中的 type；空数组 = 不按 type 过滤 */
  const activeTypes = ref<string[]>([])

  /** 关键词 + type 同时生效的文档 */
  const filteredDocuments = computed(() =>
    filterDocuments(documents.value, {
      keyword: debouncedKeyword.value,
      types: activeTypes.value,
    }),
  )

  const filteredSummaries = computed<SummaryItem[]>(() =>
    filteredDocuments.value.map(toSummary),
  )

  const filteredCount = computed(() => filteredDocuments.value.length)

  const hasFilters = computed(
    () => debouncedKeyword.value.trim().length > 0 || activeTypes.value.length > 0,
  )

  function isTypeActive(type: string) {
    return activeTypes.value.includes(type)
  }

  function toggleType(type: string) {
    activeTypes.value = isTypeActive(type)
      ? activeTypes.value.filter(item => item !== type)
      : [...activeTypes.value, type]
  }

  function setTypes(list: string[]) {
    activeTypes.value = [...new Set(list)]
  }

  function clearTypes() {
    activeTypes.value = []
  }

  function clearFilters() {
    clearKeyword()
    clearTypes()
  }

  /* ---------------- 数据装载 ---------------- */

  // 接收 ContentMeta[]（只含 path/title/description，不含 body），
  // type 由 path 推导后拼成 ContentDocument[]
  function setDocuments(docs: ContentMeta[]) {
    documents.value = docs.map(doc => ({
      path: doc.path,
      title: doc.title || '',
      description: doc.description || '',
      type: getTypeFromPath(doc.path),
    }))
    loaded.value = true
  }

  const groupedByType = computed(() =>
    summaries.value.reduce<Record<string, SummaryItem[]>>((groups, item) => {
      const type = item.type
      if (!groups[type]) groups[type] = []
      groups[type].push(item)
      return groups
    }, {}),
  )

  function getByPath(path: string) {
    return documents.value.find(d => d.path === path)
  }

  function reset() {
    documents.value = []
    loaded.value = false
    clearFilters()
  }

  return {
    documents,
    loaded,
    summaries,
    groupedByType,
    totalCount,
    setDocuments,
    getByPath,
    reset,

    // 筛选
    keyword,
    debouncedKeyword,
    searching,
    search,
    clearKeyword,
    searchResults,
    types,
    typeCounts,
    activeTypes,
    isTypeActive,
    toggleType,
    setTypes,
    clearTypes,
    filteredDocuments,
    filteredSummaries,
    filteredCount,
    hasFilters,
    clearFilters,
  }
})
