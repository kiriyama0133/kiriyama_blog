/**
 * 路径规范形态：解码 + 去掉尾部斜杠。
 *
 * 两个坑叠在一起：
 * 1. `route.path/fullPath` 是 percent-encoded（中文变 %E4%B8%89…），内容库里存的是解码原文；
 * 2. 静态托管下 nginx 会给目录索引发 301，地址栏变成 `/xxx/`（多一个斜杠），查询和比较就全部失配。
 */
export function canonicalPath(path: string): string {
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    decoded = path
  }
  return decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded
}
