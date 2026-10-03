// https://nuxt.com/docs/api/configuration/nuxt-config
import { resolve } from 'node:path'
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
        slugifyOptions: {
          lower: true,
          remove: /[^\w\s$*_+~.()'"!\-:@\u4e00-\u9fff]+/g
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
  hooks: {
    // 静态构建靠爬虫只能发现首页 SSR 出的那几条链接，这里把内容库全量灌进预渲染列表。
    'nitro:init'(nitro) {
      nitro.hooks.hook('prerender:routes', async (routes) => {
        routes.add('/')

        const dbFile = resolve(nitro.options.rootDir, '.data/content/contents.sqlite')
        try {
          const { createRequire } = await import('node:module')
          const Database = createRequire(import.meta.url)('better-sqlite3')
          const db = new Database(dbFile, { readonly: true })
          try {
            const rows = db.prepare('SELECT path FROM _content_content').all() as { path: string }[]
            for (const row of rows) {
              if (row.path.startsWith('/')) routes.add(row.path)
            }
            console.log(`[prerender] 内容路由 +${rows.length}（${dbFile}）`)
          } finally {
            db.close()
          }
        } catch (error) {
          console.warn(`[prerender] 读不到内容库 ${dbFile}，本次只会预渲染静态页：`, error)
        }
      })
    }
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03'
})
