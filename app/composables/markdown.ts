import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { refDebounced, useDebounceFn } from '@vueuse/core'
import type { ContentDocument } from '~/types/markdown'

// 默认防抖时长（ms）
export const SEARCH_DEBOUNCE = 240

export interface MarkdownFilterOptions {
  // 关键词；空串 = 不按关键词过滤
  keyword?: string
  // type 白名单；空数组 / null = 不按 type 过滤
  types?: string[] | null
}

// 正文可能是 markdown 字符串，也可能是 minimark AST（[tag, props, ...children] 的嵌套数组）
// —— 注意：列表页现在用 .select() 只取元数据，body 不再进内存，
// 所以搜索范围就是 title / description / path / type，正文不参与匹配。

// 文档对象是稳定引用，拼一次就够，别每次按键都重算
const textCache = new WeakMap<object, string>()

// 文档的可搜索文本（标题 / 摘要 / 路径 / 类型），小写，带缓存
export function documentText(doc: ContentDocument): string {
  const cached = textCache.get(doc)
  if (cached !== undefined) return cached

  const text = [doc.title, doc.description, doc.path, doc.type]
    .filter(Boolean)
    .join(' \n ')
    .toLowerCase()
    .replace(/\s+/g, ' ')

  textCache.set(doc, text)
  return text
}

// 查询串拆成小写词项（空格分隔，多个词项之间是 AND）
export function splitTerms(keyword: string): string[] {
  return keyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

// 关键词是否命中该文档
export function matchDocument(doc: ContentDocument, keyword: string): boolean {
  const terms = splitTerms(keyword)
  if (!terms.length) return true
  const text = documentText(doc)
  return terms.every(term => text.includes(term))
}

// 命中强度，仅用于排序
export function scoreDocument(doc: ContentDocument, keyword: string): number {
  const terms = splitTerms(keyword)
  if (!terms.length) return 0

  const title = (doc.title || '').toLowerCase()
  const description = (doc.description || '').toLowerCase()
  const type = doc.type.toLowerCase()
  const path = doc.path.toLowerCase()
  const text = documentText(doc)

  let score = 0
  for (const term of terms) {
    // 权重：标题前缀 > 标题包含 > 摘要 > 类型 > 路径
    if (title.startsWith(term)) score += 8
    else if (title.includes(term)) score += 5
    if (description.includes(term)) score += 3
    if (type.includes(term)) score += 2
    if (path.includes(term)) score += 1
    // 兜底 1 分：保证只要命中就 >= 1，排序时不会和 0 分（没命中）混在一起
    if (text.includes(term)) score += 1
  }
  return score
}

// 搜索：空关键词返回全部；有关键词时按命中强度排序
export function searchDocuments(docs: ContentDocument[], keyword: string): ContentDocument[] {
  if (!splitTerms(keyword).length) return docs

  return docs
    .filter(doc => matchDocument(doc, keyword))
    .map(doc => ({ doc, score: scoreDocument(doc, keyword) }))
    .sort((a, b) => b.score - a.score || (a.doc.title || '').localeCompare(b.doc.title || ''))
    .map(item => item.doc)
}

// 关键词 + type 同时过滤：先按 type 收窄，再按关键词搜索
export function filterDocuments(
  docs: ContentDocument[],
  options: MarkdownFilterOptions = {},
): ContentDocument[] {
  const { keyword = '', types } = options
  const scope = types && types.length ? docs.filter(doc => types.includes(doc.type)) : docs
  return searchDocuments(scope, keyword)
}

export interface MarkdownSearchOptions {
  // 防抖时长（ms），默认 SEARCH_DEBOUNCE
  delay?: number
}

// 搜索状态。刻意拆成两个 ref：
// - keyword          跟着输入实时变化 → 直接 v-model 给 input，光标 / 清空都不卡
// - debouncedKeyword 防抖之后的值 → 只有它参与过滤计算
// - searching        两者不一致 = 输入已经变了但结果还没跟上，可当 loading 提示
//
// 需要命令式调用时用 search(kw)，它同样带防抖，且不改动上面的状态。
export function useMarkdownSearch(
  docs: Ref<ContentDocument[]>,
  options: MarkdownSearchOptions = {},
) {
  const delay = options.delay ?? SEARCH_DEBOUNCE

  const keyword = ref('')
  const debouncedKeyword = refDebounced(keyword, delay)

  const searching = computed(() => keyword.value.trim() !== debouncedKeyword.value.trim())

  // 防抖后的搜索结果
  const results = computed(() => searchDocuments(docs.value, debouncedKeyword.value))

  // 命令式调用：防抖后返回匹配结果（不写状态）
  const search = useDebounceFn(
    (value: string) => searchDocuments(docs.value, value),
    delay,
  )

  function clear() {
    keyword.value = ''
  }

  return { keyword, debouncedKeyword, searching, results, search, clear, delay }
}
