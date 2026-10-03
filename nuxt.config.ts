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
  // ---------------------------------------------------------------
  // 路径生成：@nuxt/content 用 slugify 清洗每一段路径，默认规则会把
  // 非 ASCII（中文）整段删掉、把 $ 映射成 dollar。结果大量文件塌成同一个 path：
  //   cpp/opengel/三角形绘制.md …资产和模型加载.md(13 篇) → 全是 /cpp/opengel
  //   cpp/C++的学习笔记.md / C++编译器思考.md / 优雅和正确的使用C++的注释.md → 全是 /cpp/c++
  //   csharp/C#的多线程.md / c#的流传输文件…md → 全是 /csharp/c
  // 于是 .path(route.path).first() 永远命中该 path 的第一条。
  // 这里把 CJK 加回白名单，并去掉真正在 URL 里会出事的字符（# ? % & 空格等）。
  // ---------------------------------------------------------------
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
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03'
})
