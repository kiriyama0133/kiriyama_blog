import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import type { ContentCollectionItem } from '@nuxt/content'

// 预留文档处理方法
// 注意：这里处理的是「含 body 的完整页面」，跟列表页用的 ContentMeta（只有元数据）不是一回事。
type MinimarkNode = string | [string, Record<string, unknown>, ...unknown[]]
interface MinimarkBody {
  value: MinimarkNode[]
}
export interface ContentSummaryInput {
  doc: Ref<ContentCollectionItem | null>
  options: ContentSummaryInputOptions
}
export interface ContentSummaryInputOptions {
  maxLength?: number
  firstParagraphOnly?: boolean
}
export interface ContentSummaryOutput {
  title: string
  summary: string
}
function flattenText(node: unknown): string {
  if (typeof node === 'string') return node
  if (!Array.isArray(node)) return ''
  return node.slice(2).map(flattenText).join('')
}

function extractFirstParagraph(body: MinimarkBody): string {
  for (const node of body.value as MinimarkNode[]) {
    if (Array.isArray(node) && node[0] === 'p') {
      return flattenText(node)
    }
  }
  return ''
}

//
function extractFullText(body: MinimarkBody): string {
  return (body.value as MinimarkNode[]).map(flattenText).join(' ').trim()
}

export function useContentSummary(
  doc: Ref<ContentCollectionItem | null>,
  options: ContentSummaryInputOptions = {}
): ComputedRef<ContentSummaryOutput> {
  const { maxLength = 120, firstParagraphOnly = true } = options
  return computed(() => {
    const page = doc.value
    if (!page) return { title: '', summary: '' }
    const title = page.title || page.seo?.title || page.path
    let summary = page.description || page.seo?.description || ''
    if (!summary && page.body?.value) {
      const text = firstParagraphOnly
        ? extractFirstParagraph(page.body)
        : extractFullText(page.body)
      summary = text.length > maxLength ? text.slice(0, maxLength) + '...' : text
    }
    return { title, summary }
  })
}

export function getTypeFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return 'root'
  if (parts.length === 1) return 'uncategorized'
  return parts[0] ?? 'uncategorized'
}
