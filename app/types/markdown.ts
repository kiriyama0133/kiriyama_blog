import type { ContentCollectionItem } from '@nuxt/content'

/**
 * 列表页 / 搜索真正需要的元数据。
 * 刻意不含 `body`（minimark AST，最重的一块），配合 queryCollection().select() 只取这几列。
 * 注意：SQLite 表里**没有** `type` / `date` 列，type 是由 path 推导出来的（见 getTypeFromPath）。
 */
export interface ContentMeta {
  path: string
  title: string
  description: string
}

/** store 内部用的文档：元数据 + 由路径推导出的 type */
export interface ContentDocument extends ContentMeta {
  type: string
}

/** 含 body 的完整条目，需要正文时（如 [...slug].vue / useContentSummary）用这个 */
export type ContentListItem = Omit<ContentCollectionItem, 'body'>
export type ContentDocuments = ContentCollectionItem[]
