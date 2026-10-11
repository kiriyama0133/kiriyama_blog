// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/main.css', '~/assets/css/main.scss'],
  modules: ['@nuxt/content', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/eslint'],
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
