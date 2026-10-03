import { defineNuxtModule } from '@nuxt/kit'

interface ContentFile {
  id?: string
  body: string
}

/**
 * 用内容文件自身的路径当 URL（中文、大小写、标点全保留），不再过 slugify。
 *
 * 两个关键点：
 * 1. `content:file:beforeParse` 是**构建期的 Nuxt 钩子**（@nuxt/content 内部走
 *    `nuxt.callHook('content:file:beforeParse')`），不是 Nitro 运行时钩子 ——
 *    写在 `server/plugins/` 下的 defineNitroPlugin 永远不会被调用，必须是 Nuxt 模块。
 * 2. v3 的 frontmatter 字段是 `path`（v2 才是 `_path`）；pathMeta 里 `...content`
 *    展开在后，所以 frontmatter 写了 path 就一定优先。这里只补「没写 path」的文件。
 */
export default defineNuxtModule({
  meta: { name: 'content-path-preserve' },
  setup(_options, nuxt) {
    nuxt.hook('content:file:beforeParse', ({ file }: { file: ContentFile }) => {
      if (!file.id?.endsWith('.md')) return

      const segments = file.id.split('/')
      segments.shift() // 丢掉集合名（content）
      const lastName = (segments.pop() ?? '').replace(/\.md$/, '').replace(/\.draft$/, '')
      if (lastName !== 'index') segments.push(lastName) // index.md 代表所在目录本身

      const path = '/' + segments.join('/')

      const frontMatter = file.body.match(/^---\n([\s\S]*?)\n---/)
      if (!frontMatter) {
        file.body = `---\npath: ${JSON.stringify(path)}\n---\n\n${file.body}`
        return
      }
      if (/^[ \t]*path[ \t]*:/m.test(frontMatter[1] ?? '')) return
      file.body = file.body.replace(/^---\n/, `---\npath: ${JSON.stringify(path)}\n`)
    })
  }
})
