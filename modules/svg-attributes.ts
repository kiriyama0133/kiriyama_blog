/**
 * 把笔记里手写 SVG 的属性名修回「HTML/SVG 属性」的形式。
 *
 * 背景：@nuxt/content 解析 markdown 时，内联 HTML 里的 <svg> 会走 hast，
 * 而 hast 的属性名是驼峰（textAnchor / dominantBaseline / fontSize / className），
 * 渲染时这些驼峰名被原样写到元素上：`<text textAnchor="middle" fontSize="14">`。
 * SVG 只认连字符名（text-anchor / font-size），未知属性会被浏览器整条丢弃 ——
 * 于是文字没了字号（回退成继承的 16px）、居中失效、描边变粗、箭头（marker-end）消失。
 *
 * 这里在 content:file:afterParse 阶段（内容入库前）遍历 minimark 节点，
 * 仅对 <svg> 子树内的 props 做「驼峰 → 属性名」还原，兼容 SSR 与客户端：
 * 不用等水合，首屏就是对的。代码块等非 SVG 节点的 className 一律不碰。
 */

import { defineNuxtModule } from 'nuxt/kit'

/** 驼峰（小写）→ 真正的属性名。只收「连字符化」的那些，
 *  viewBox / refX / refY / markerWidth / markerHeight 这类本来就是驼峰的不要放进来。 */
const SVG_ATTRS: Record<string, string> = {
  classname: 'class',
  textanchor: 'text-anchor',
  dominantbaseline: 'dominant-baseline',
  alignmentbaseline: 'alignment-baseline',
  baselineshift: 'baseline-shift',
  fontfamily: 'font-family',
  fontsize: 'font-size',
  fontweight: 'font-weight',
  fontstyle: 'font-style',
  fontvariant: 'font-variant',
  letterspacing: 'letter-spacing',
  wordspacing: 'word-spacing',
  textdecoration: 'text-decoration',
  strokewidth: 'stroke-width',
  strokelinecap: 'stroke-linecap',
  strokelinejoin: 'stroke-linejoin',
  strokedasharray: 'stroke-dasharray',
  strokedashoffset: 'stroke-dashoffset',
  strokeopacity: 'stroke-opacity',
  strokemiterlimit: 'stroke-miterlimit',
  fillopacity: 'fill-opacity',
  fillrule: 'fill-rule',
  clippath: 'clip-path',
  cliprule: 'clip-rule',
  markerend: 'marker-end',
  markerstart: 'marker-start',
  markermid: 'marker-mid',
  shaperendering: 'shape-rendering',
  textrendering: 'text-rendering',
  stopcolor: 'stop-color',
  stopopacity: 'stop-opacity',
  paintorder: 'paint-order',
  vectoreffect: 'vector-effect',
  floodcolor: 'flood-color',
  floodopacity: 'flood-opacity',
  colorinterpolation: 'color-interpolation',
  colorinterpolationfilters: 'color-interpolation-filters',
  transformorigin: 'transform-origin',
  transformbox: 'transform-box',
  pointerevents: 'pointer-events'
}

type Props = Record<string, unknown>
/** minimark 节点：字符串（文本）或 [tag, props, ...children] */
type MinimarkNode = string | [string, Props?, ...MinimarkNode[]]

/* 就地改 props：minimark 的节点数组可能是冻结的，整体替换 node[1] 会静默失败；
   改对象自身的键则是安全的（这里没有定义成只读）。 */
function fixProps(props: Props) {
  for (const key of Object.keys(props)) {
    const attr = SVG_ATTRS[key.toLowerCase()]
    if (!attr || attr === key) continue
    // 原文已经写了正确属性名时以它为准，别被同名驼峰覆盖
    if (!(attr in props)) props[attr] = props[key]
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- 键名是按映射算出来的，这里就是要删掉旧键
    delete props[key]
  }
}

function walk(node: MinimarkNode | undefined, insideSvg: boolean) {
  if (!node || typeof node === 'string' || !Array.isArray(node)) return

  const [tag, props, ...children] = node
  const inSvg = insideSvg || String(tag).toLowerCase() === 'svg'

  if (inSvg && props && typeof props === 'object' && !Array.isArray(props)) {
    fixProps(props)
  }

  for (const child of children) walk(child, inSvg)
}

export default defineNuxtModule({
  meta: { name: 'svg-attributes' },
  setup(_options, nuxt) {
    nuxt.hook('content:file:afterParse', (ctx) => {
      const body = (ctx.content as { body?: { type?: string; value?: MinimarkNode[] } } | undefined)
        ?.body
      if (!body || body.type !== 'minimark' || !Array.isArray(body.value)) return
      for (const node of body.value) walk(node, false)
    })
  }
})
