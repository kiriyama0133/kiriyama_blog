// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/main.css', '~/assets/css/main.scss'],
  modules: [
    '@nuxt/content',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
    'gsap-nuxt-module',
    'nuxt-mathjax'
  ],
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'zh-CN',
    // 相对 i18n/ 目录（restructureDir 默认 'i18n'）→ 实际路径 i18n/locales/
    langDir: 'locales',
    locales: [
      { code: 'zh-CN', language: 'zh-CN', name: '中文', file: 'zh-CN.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
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
        remarkPlugins: { 'remark-math': {} },
        rehypePlugins: { 'rehype-mathjax': {} },
        // v3 默认 highlight: false
        highlight: {
          // 键名映射 html.<key>：dark → 生成 html.dark .shiki span { color: var(--shiki-dark) }
          theme: {
            default: 'github-light',
            dark: 'github-dark'
          },
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
