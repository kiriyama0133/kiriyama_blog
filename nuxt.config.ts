// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/main.css', '~/assets/css/main.scss'],
  modules: ['@nuxt/content', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint', '@nuxtjs/i18n'],
  i18n: {
    // 站点是静态部署（nitro.preset = static），且现有笔记 URL 全在根路径。
    // no_prefix = URL 完全不变，对 SSG 与 nginx 零影响，现有笔记链接一个都不用动。
    // 代价：一个 URL 只对应一份静态 HTML（构建期渲染成默认语言），
    // 所以「按请求头 Accept-Language 出不同 HTML」做不到 —— 语言在客户端按浏览器偏好切。
    strategy: 'no_prefix',
    // 默认语言；no_prefix 下它同时充当检测失败时的兜底
    defaultLocale: 'zh-CN',
    // 相对 i18n/ 目录（restructureDir 默认 'i18n'）→ 实际路径 i18n/locales/
    langDir: 'locales',
    locales: [
      // 用 langDir 时 file 是必填项
      { code: 'zh-CN', language: 'zh-CN', name: '中文', file: 'zh-CN.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    // 语言完全跟着浏览器语言偏好走（客户端读 navigator.languages）。
    // 刻意不落 cookie：站点没有语言切换按钮，一旦把检测结果存下来，
    // 用户之后改了浏览器语言也会被旧值压住，且无从改回。
    detectBrowserLanguage: {
      useCookie: false,
      fallbackLocale: 'zh-CN'
    }
  },
  app: {
    head: {
      script: [
        {
          // 首屏防闪：在样式生效前把 .dark 挂到 <html> 上。
          innerHTML:
            "(function(){try{var s=localStorage.getItem('blog-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()",
          tagPosition: 'head' as const
        }
      ]
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  content: {
    build: {
      pathMeta: {
        // slugify 默认把中文整段删掉（\w 不含 CJK），补进白名单。
        slugifyOptions: {
          lower: true,
          remove: /[^\w\s$*_+~.()'"!\-:@\u4e00-\u9fff]+/g
        }
      },
      markdown: {
        // v3 默认 highlight: false，不配 = 代码块完全不高亮。
        highlight: {
          // 键名映射 html.<key>：dark → 生成 html.dark .shiki span { color: var(--shiki-dark) }
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          },
          // 默认值（json/js/ts/html/css/vue/shell/mdc/md/yaml）+ 笔记里实际用到的。
          // 指定后会整组替换默认名单，所以默认项也要带上。
          // c++ / c# / cs 是 cpp / csharp 的内置别名，不用单独列；mermaid 走 ProsePre 覆写，不走高亮。
          langs: [
            'json',
            'js',
            'ts',
            'html',
            'css',
            'vue',
            'shell',
            'mdc',
            'md',
            'yaml',
            'c',
            'cpp',
            'csharp',
            'xml',
            'nginx',
            'graphql',
            'cmake',
            'bash',
            'scss'
          ]
        }
      }
    }
  },
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: false
    }
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03'
})
