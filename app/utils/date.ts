/**
 * 笔记日期归一化。
 */
export function formatNoteDate(value: unknown): string {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : toISODate(value)
  }
  if (typeof value !== 'string') return ''
  const matched = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  return matched ? `${matched[1]}-${matched[2]}-${matched[3]}` : ''
}

/** 按本地时区拼，避免 toISOString() 把 UTC+8 的凌晨日期倒回前一天 */
function toISODate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
