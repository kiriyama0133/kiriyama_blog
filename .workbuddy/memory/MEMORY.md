# 项目约定 · E:\blog

## 主题（明暗）
- 开关是 `<html>` 上的 `.dark` 类（只能用这个类名：Nuxt Content 的 shiki 暗色规则写死了 `html.dark`）。
  Tailwind 侧用 `@custom-variant dark (&:where(.dark, .dark *))`。
- 状态：`app/composables/useTheme.ts`（`useState('theme')` + localStorage `blog-theme`）；
  首屏防闪靠 `nuxt.config.ts` 的 `app.head.script` 内联脚本。UI：`components/ThemeToggle.vue`（挂在 app.vue）。
- 色值三份，改色要一起改：`main.scss` `$color-dark-*`、`main.css` `@theme --color-dark-*`、
  `main.css` 的语义层 `:root/.dark --ui-*`。
- **组件 scoped 样式一律用 `--ui-*`**（那是普通 CSS 变量，永远存在且跟着 `.dark` 翻）；
  `@theme` 变量会被 Tailwind 按需裁剪，不能依赖。
- 调色板逻辑：暖黄画布 → 冷紫（互补）面 → 橄榄（邻近）按钮 → 暖褐搜索。暗色保持色相、翻明度、降纯度。

## 坑
- **`v-if` 用的绑定必须在 `<script setup>` 里声明**：漏了不报错，只是静默不渲染
  （dev 只有一条 `Property "x" was accessed during render but is not defined on instance`）。
- **Vue scoped 样式里别写 `:global(...) &`**：编译后 & 连同后面的选择器会被丢掉
  （`:global(body:has(.x)) .theme-toggle` → `body:has(.x){...}`）。需要按页面改位置就用 CSS 变量
  （例：`--floating-top`，首页 `body:has(.filter-bar)` 时变 4.75rem）。
- SFC `<style scoped>` 是未分层样式，永远压过 `main.css` 里 `@layer components/utilities` 的同类名；
  所以 `.btn` / `.card` 这类公共类要在 main.css 里补 `.dark ...` 变体，而不是在组件里用 `dark:` 工具类去盖。
  反过来，模板里没有 scoped 样式冲突的地方，用 `dark:bg-dark-*` 这类工具类即可。
- 固定层叠：首页 `.filter-bar` 是 `z-50`，浮动按钮要 ≥55，否则被 backdrop-filter 糊掉。
  全站刻度：BackToTop 40 < filter-bar/RightRail 50 < FloatingMenu/ThemeToggle 55 < Notice 60。
  **fixed 元素必须显式给 z-index**：iOS 上 `pre(overflow-x:auto)` 是合成层，会盖住没层级的 fixed。
- 代码高亮：`@nuxt/content` **v3 的 `highlight` 默认是 false**，必须在
  `content.build.markdown.highlight` 显式配置（双主题 default/dark + `langs` 全名单；
  指定 `langs` 会整组替换默认名单）。v3 字段是 `langs`，不是 v2 的 `preload`。
  **shiki 没有 xaml 语言**（写进 langs 会直接崩 dev server），xaml 围栏自动回退纯文本。
  3.16 的高亮输出是类名压缩（`.sXxx{--shiki-default:…;--shiki-dark:…}`），验证看 `pre.shiki` 类
  和代码块后的 `<style>`（内含 `html.dark .shiki span` 规则），别搜内联 style。
- mermaid：覆写在 `app/components/content/ProsePre.vue`（`language==='mermaid'` → `MermaidBlock.vue`，
  动态 import、随明暗主题重画）；mermaid **不要**加进 shiki `langs`。
- 仓库里有 on-save 格式化（会把空 `catch` 里的注释抹掉）：别靠注释过 `no-empty`，写真实语句。
- **同一个文件的多处改动不要放在同一条消息里并行提交**：本环境里并行的 Edit 会各自基于旧快照写回、
  互相覆盖，结果是「一半改了、一半没改」，而工具回报全是成功（index.vue / heatmap.ts /
  UpdateHeatmap.client.vue 都中招过）。改同一个文件就一次一个；改动多就直接整文件 Write（原子）。
  改完务必重新读一遍或跑 lint 验证，别信 Edit 的返回值。
- Prettier 配置在 `prettier.config.mjs`，但仓库现有代码跟它不一致（大量文件 `--check` 不过）；
  **不要随手 `prettier --write`**，会搅出无关 diff。

## 内容路径（@nuxt/content）
- **path 由 slugify 生成，配置就写在 `nuxt.config.ts` 的 `content.build.pathMeta.slugifyOptions`**：
  `{ lower: true, remove: /[^\w\s$*_+~.()'"!\-:@\u4e00-\u9fff]+/g }`（把 CJK 加回白名单，否则中文整段被删、
  大量文档塌成同一个 path）。`modules/content-path-preserve.ts` 那套「逐字路径」方案**已删除、不要再加回来**
  ——它会把 `#`、空格带回 URL（`/csharp/C#的多线程` 里的 `#` 变成锚点，点下去落首页）。
- 若要写 `content:file:beforeParse` 之类钩子：那是**构建期 Nuxt 钩子**（`nuxt.callHook`），
  必须放 `modules/`，写在 `server/plugins/*.ts` 的 `defineNitroPlugin` 里永远不会被调用。
  v3 的 frontmatter 字段是 `path`（v2 才是 `_path`）。
- 文件名里别出现 `#`、`?`、`%`（破坏 URL/YAML）；`C#的多线程.md` → `CSharp的多线程.md` 这类重命名仍然必要。
- 自检：`.data/content/contents.sqlite` → `SELECT path,title FROM _content_content`：
  行数 = md 文件数、**path 无重复**（重复 = slugify 又塌陷了）。
- **`route.path` 是 percent-encoded**（中文 `%E4%B8%89`、`+` 变 `%2B`），库里是解码原文 —— 见下面「URL / 路径约定」。

## 组件 / composable 分工
- 分享：`composables/useShareNote.ts`（Web Share API → 复制链接兜底，自己调 `useNotice`）；
  组件只写 `@click="shareNote"`。
- 轻提示：状态 `composables/useNotice.ts` + UI `components/Notice.vue`，全局只在 `app.vue` 挂一份。
- 文档页的数据通道只有 `stores/reader.ts`（layout 与 page 是兄弟关系）：
  slug 页 `setArticle({ path, title, description, toc })`。
- `FloatingMenu.vue` = 返回/分享两个按钮；`ThemeToggle.vue` = 明暗切换，同高右侧。

## 国际化（i18n）
- 模块 `@nuxtjs/i18n@10.6.0`（**包名是 `@nuxtjs/i18n`**，没有 `@nuxt/i18n` 这个东西）。
- `strategy: 'no_prefix'` + `defaultLocale: 'zh-CN'`：URL 完全不变。
  原因是站点 `nitro.preset: 'static'` —— 构建期只渲染一份 HTML，
  **请求头 `Accept-Language` 对页面 HTML 不起作用**，语言只能在客户端按浏览器偏好（`navigator.languages`）切。
  要「按请求头出不同 HTML」必须改成 SSR 或前缀式 URL，二者都要动 SSG 部署链路。
- 翻译文件 `i18n/locales/{zh-CN,en}.json`（`restructureDir: 'i18n'`、`langDir: 'locales'` 都是默认值；
  **用了 langDir 时每个 locale 的 `file` 是必填**，漏了直接抛错）。
- `detectBrowserLanguage: { useCookie: false, fallbackLocale: 'zh-CN' }` —— 刻意不落 cookie：
  没有切换按钮时，把检测结果存下来会让用户改了浏览器语言仍被旧值压住、且无从改回。
- **`<html lang>` 不会自动设**：`app.vue` 自己 `useHead({ htmlAttrs: { lang } })`（取 `localeProperties`）。
  别用 `useLocaleHead()`：no_prefix 下它输出的 canonical / hreflang 只会指向页面自己，还刷 baseUrl 警告。
- UI 文案一律 `$t()`；站点名 / 描述在 `composables/useSiteMeta.ts`（原 `utils/site.ts` 已删）。
- 纯 util 需要本地化文案时用「入参注入」，别在 util 里调 i18n：
  热力图 = `WEEKDAY_KEYS` + `DEFAULT_WEEKDAY_LABELS` 兜底，`buildHeatmapGrid({ weekdayLabels })`。

## 验证手法（Vue/Nuxt 页面）
- Node 22 全局 `WebSocket` + `fetch` 可零依赖走 CDP 驱动本机 headless Chrome
  （本机路径 `C:\Program Files\Google\Chrome\Application\chrome.exe`）。
  脚本用 `node --input-type=module - <<'EOF'` 从 stdin 喂进去（不留文件），抓
  `Runtime.consoleAPICalled`（含 `stackTrace`）能直接定位是哪个组件的警告。
- **必须同时开 `Log` 和 `Network` 域**：只开 `Runtime` 看不到资源加载失败，
  「一条 console 消息都没有」其实是客户端 JS 压根没跑，不是「没问题」。
  要看 `Log.entryAdded`、`Network.loadingFailed`、以及 4xx/5xx 的 `responseReceived`。
- **不要用固定 sleep 等挂载**：全新 dev server 首次按需编译客户端模块可能要几十秒；
  要轮询到某个只在客户端出现的元素（如 `.theme-toggle__btn`）再断言。
- **端口以 dev 日志为准**：3000 被占时 Nuxt 会自动退到 3001（日志里 `[get-port] Unable to find...`），
  而沙箱里的 `Get-NetTCPConnection` 看不到占用者 → 会一直打到旧 server 上，查半天假问题。
- 纯静态检查更轻：`curl http://[::1]:3000/_nuxt/<模块路径>` 拿 Vite 编译产物（CSS 里 `\n`、`\\:` 是转义）。
- dev server 只监听 IPv6：用 `[::1]:3000`（127.0.0.1 连不上）。改 `nuxt.config.ts` 会自动重启，重启期间请求会返回错误页。
- PowerShell 重定向是 UTF-16：`Get-Content -Encoding Unicode x | Set-Content -Encoding utf8 y` 后再读。
  （这个环境里 PowerShell 沙箱偶尔整个失败，bash 的 stdout 反而好用；bash 没有 coreutils，但 `curl` 可用。）


## 样式架构（Nuxt 4 + Tailwind v4 + Sass）
- `@import "tailwindcss"` / `@apply` / `@theme` **只能写在 `.css`**（`app/assets/css/main.css`）；
  `.scss` 只放 Sass 变量、嵌套、原生属性。
- 颜色 token 在 main.css 的 `@theme`（`--color-light-*`）；组件里优先用工具类（`bg-light-button`…），
  别在 SCSS 里手写 `var(--color-light-*)`（Tailwind v4 按需输出，可能取不到值）。
- SFC `<style scoped>` 是未分层样式，永远压过 `main.css` 里 `@layer components` 的同名类。
- Prettier 配置在 `prettier.config.mjs`，仓库现有代码跟它不一致（大量文件 `--check` 不过）；
  **不要随手 `prettier --write`**，会搅出无关 diff。

## 弧形（扇形）虚拟列表
- `app/components/FanVirtualList.vue`：`useVirtualList` 直线轨道 + 极坐标换算圆心角；
  `driver: 'self' | 'window'`，window 模式取页面进度并要 `overscroll-behavior: auto`，尾部要补容器高的尾巴。
- 调参用 `demo/fan-list-lab.html`。

## SSG 静态部署（重要）
- 首页 `index.vue` 直接渲染全部文章（**无分页**）→ 首屏 SSR 输出全部文档链接 → Nitro `crawlLinks` 从 `/` 就能爬全，
  `nuxt.config.ts` 只需要 `nitro: { preset: 'static', prerender: { crawlLinks: true, routes: ['/'], failOnError: false } }`。
- **不要再引入读 sqlite 的 `prerender:routes` 钩子**：那是「首页只 SSR 10 条链接」时的补丁，
  分页去掉后纯属多余，还额外要求 better-sqlite3 原生模块可用。只有首页重新加回分页时才会再次需要。
- **别用 `meta/<id>.json` 的 `prerendered` 数组校验**：它只记录「显式 add 进列表的路由」，
  crawlLinks 抓来的不计入 —— 线上现状是 `prerendered: []` 而 134 个文档页都是好的。
  校验改看产物目录里有没有 `xxx/index.html`，或线上抽查文档页的 `<title>` 是否等于首页标题（等于 = 回退）。
- 爬虫会从正文里抓出伪路由（如 `/vue/目录`、裸 `<router-link>`）报 404，`failOnError: false` 下不阻塞，属噪音。
  ⚠️ 同一开关也会让「预渲染失败」静默吞掉，旧产物文件继续留在服务器 → 排查线上怪现象时先怀疑这个。
- **`experimental.payloadExtraction` 必须保持默认（true），不要写 `false`**：
  关掉后客户端导航没有 `_payload.json` 可读，会在浏览器里重跑 `queryCollection` → 去下载
  `/__nuxt_content/content/sql_dump.txt`（WASM sqlite）。那份 dump 一旦和线上页面/JS 不是同一次构建
  （残留、没覆盖），**链接是对的但点进去 404，刷新又正常**——2026-10-03 那次故障就是这个。
  开着 = 每篇文档的数据预渲染成同目录 `_payload.json`，URL 与数据同源同一次构建，客户端也不再下载那份库。
- 定位「URL 对但导航 404」的固定套路：① 抓首页 HTML 的 `<a href>` 看链接对不对；
  ② 下载 `/__nuxt_content/content/sql_dump.txt`（base64+gzip 后是 JSON 化的 SQL 语句数组）解析 `_content_content`
  的 `path` 列，和 href 对差集；③ 比 dump 里 `checksum_content` 与页面 JS 里的 `checksums.content`
  （或 `.nuxt/content/manifest.ts`）——**不等即非同一次构建**。

## URL / 路径约定
- 比较或查询路径前一律过 `app/utils/path.ts` 的 `canonicalPath()`（解码 + 去尾斜杠）：
  `route.path/fullPath` 是 percent-encoded，内容库与 `item.path` 是解码原文。
  已用在：`[...slug].vue` 内容查询与 reader.path、`RightTabWithNav` 的 isActive、导航栈中间件。
- **禁止在 app 侧对尾斜杠做重定向**去「修正」地址栏：nginx 会 301 补斜杠，app 再 301 去掉 = 死循环。
- Nitro 静态产物是 `xxx/index.html`，所以 `/xxx` 会被 nginx 目录索引 301 成 `/xxx/`，属机制行为。

