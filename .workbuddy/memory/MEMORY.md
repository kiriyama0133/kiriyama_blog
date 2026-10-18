# 项目约定 · E:\kiriyama_blog

## 颜色 / 主题
- 暗色开关 = `<html>.dark`（shiki 暗色规则写死 `html.dark`）；Tailwind 侧 `@custom-variant dark (&:where(.dark, .dark *))`。
- 状态 `composables/useTheme.ts`（`useState('theme')` + `localStorage: blog-theme`），首屏防闪靠 `nuxt.config.ts` 的 `app.head.script`；UI `ThemeToggle.vue`（挂在 app.vue）。
- 改色同步三处：`main.scss $color-dark-*`、`main.css @theme --color-dark-*`、`main.css :root/.dark --ui-*`。
- 组件里用 `--ui-*`（普通变量，永远在、随 `.dark` 翻）；`@theme` 变量会被 Tailwind 按需裁剪，不能依赖。
- 调色板：暖黄画布→冷紫面→橄榄按钮→暖褐搜索；暗色保色相、翻明度、降纯度。

## 样式架构与坑
- `@import "tailwindcss"` / `@apply` / `@theme` 只能写在 `.css`；`.scss` 只放 Sass 变量与嵌套。
- SFC `<style scoped>` 是未分层样式，永远压过 `main.css` 的 `@layer components` 同名类 → `.btn/.card` 的暗色变体写在 main.css，别在组件里用 `dark:` 盖。
- `v-if` 用的变量必须在 `<script setup>` 声明（漏了静默不渲染，只有一条 accessed during render 警告）。
- Vue scoped 里别写 `:global(...) &`（`&` 连同后面的选择器会被丢掉）；要按页面改位置用 CSS 变量（如 `--floating-top`）。
- z-index 刻度：BackToTop 40 < filter-bar/RightRail 50 < FloatingMenu/ThemeToggle 55 < Notice 60；**fixed 必须显式给 z-index**（iOS 上 `pre(overflow-x:auto)` 是合成层会盖住它）。
- Prettier 配置在但仓库代码不统一，**不要 `prettier --write`**（搅出无关 diff）；on-save 格式化会抹掉空 `catch` 里的注释。
- **同一文件的多处改动不要并行提交 Edit**：会各自基于旧快照互相覆盖、工具却报成功。改多就整文件 Write，改完重读或跑 lint。

## 内容管线（@nuxt/content 3.16）
- path 由 slugify 生成，配置在 `content.build.pathMeta.slugifyOptions`：`{ lower:true, remove: /[^\w\s$*_+~.()'"!\-:@\u4e00-\u9fff]+/g }`（CJK 必须加回白名单）。`content-path-preserve` 那套已删，别再恢复。
- `content:file:beforeParse/afterParse` 是**构建期 Nuxt 钩子**，只能放 `modules/`（写进 `server/plugins` 永不触发）。frontmatter 字段是 `path`（v2 是 `_path`）。
- 文件名别含 `#`、`?`、`%`。
- **笔记里内联 SVG 的属性会被写成驼峰**：hast→minimark 原样保留 `textAnchor`/`fontSize`/`className`，浏览器不认 → 字号回退 16px、居中失效、箭头消失、class 样式失灵。已由 `modules/svg-attributes.ts`（`content:file:afterParse`）还原为 `text-anchor`/`font-size`/`class`，只处理 `<svg>` 子树（避免踩代码块的 `className`）。改此模块后要 `rm -rf .data/content` 重新解析。
- 查库：`node --experimental-sqlite` 读 `.data/content/contents.sqlite`，`SELECT body FROM _content_content WHERE path=...` 直接看 minimark 数组（props 必须是对象，`null` = 被写坏了）。
- 自检 path：`SELECT path,title FROM _content_content`，行数 = md 数、path 无重复。
- 高亮：v3 `highlight` 默认 false，必须在 `content.build.markdown.highlight` 配（双主题 + `langs` 全名单；**shiki 没有 xaml**，写进去会崩 dev）。mermaid 不进 langs，覆写在 `app/components/content/ProsePre.vue` → `MermaidBlock.vue`。
- `route.path` 是 percent-encoded，库里是解码原文。

## i18n
- `@nuxtjs/i18n@10.6.0`（不是 `@nuxt/i18n`）。
- `strategy:'no_prefix'` + `defaultLocale:'zh-CN'`，URL 不变；因 `nitro.preset:'static'` 请求头 `Accept-Language` 对 HTML 无效，语言只能在客户端按 `navigator.languages` 切。
- 翻译在 `i18n/locales/{zh-CN,en}.json`（**用了 langDir 时每个 locale 的 `file` 必填**）。
- `detectBrowserLanguage: { useCookie:false, fallbackLocale:'zh-CN' }` —— 刻意不落 cookie（没切换按钮时落 cookie 会把语言锁死）。
- `<html lang>` 要自己在 `app.vue` 里 `useHead({ htmlAttrs:{ lang } })`；别用 `useLocaleHead()`。
- 文案一律 `$t()`；站点名/描述在 `composables/useSiteMeta.ts`。纯 util 用入参注入（热力图 `WEEKDAY_KEYS` + `buildHeatmapGrid({ weekdayLabels })`）。

## 组件分工
- 分享 `useShareNote.ts`；轻提示 `useNotice.ts` + `Notice.vue`（只在 app.vue 挂一份）。
- 文档页数据只走 `stores/reader.ts`（layout 与 page 是兄弟）：slug 页 `setArticle({ path, title, description, toc })`。
- `FloatingMenu.vue` = 返回/分享；`ThemeToggle.vue` = 明暗。

## 验证手法
- CDP 零依赖：Node 22 `WebSocket`+`fetch` 驱动本机 Chrome；**必须同开 Log+Network**，只开 Runtime 会把「JS 没跑」误判成「零报错」。
- 一张截图最省事：`chrome --headless=new --screenshot=x.png --window-size=1440,1000 --virtual-time-budget=12000 URL`。
- dev 只监听 IPv6 → 用 `[::1]:3000`；**端口以 dev 日志为准**（3000 被占会退到 3001，沙箱看不到占用者）。
- 改 `nuxt.config.ts` / `modules/*` 会整进程重启并**重解析全部内容（约 60–90s）**，别急着断言；Vite 想清自己的依赖缓存时可能被沙箱批量删除保护拦住（`SAFE_DELETE_BULK_CONFIRM_REQUIRED`），把 `node_modules/.cache/vite` 移走即可。

## SSG 部署
- 首页渲染全部文章 → `nitro:{ preset:'static', prerender:{ crawlLinks:true, routes:['/'], failOnError:false } }` 足够；别再加读 sqlite 的 `prerender:routes` 钩子。
- 别用 `meta/<id>.json` 的 `prerendered` 校验（它只记显式 add 的路由）；看产物目录里有没有 `xxx/index.html`。
- `failOnError:false` 会静默吞掉预渲染失败 → 排查线上怪现象先怀疑旧产物残留。
- **`experimental.payloadExtraction` 保持默认 true**：关掉会退化成下载 `sql_dump.txt`，构建不一致时「链接对但点进去 404、刷新正常」。
- 该故障三步定位：抓首页 `<a href>` → 对比 sql_dump 的 path 列 → 比 `checksum_content` 与 JS 里的 `checksums.content`（不等 = 非同次构建）。

## URL / 路径
- 比较或查询前一律过 `app/utils/path.ts` 的 `canonicalPath()`（解码 + 去尾斜杠）。
- 禁止在 app 侧对尾斜杠做重定向（nginx 会 301 补斜杠 → 死循环）。

## 弧形虚拟列表
- `FanVirtualList.vue`：`useVirtualList` 直线轨道 + 极坐标换算；`driver:'self'|'window'`（window 要 `overscroll-behavior:auto` 且尾部补容器高）；调参 `demo/fan-list-lab.html`。
