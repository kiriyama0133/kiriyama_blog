# 项目约定 · E:\blog

## 样式架构（Nuxt 4 + Tailwind v4 + Sass）
- Tailwind 入口 `@import "tailwindcss";` 与所有 `@apply` / `@theme` **必须写在 `.css` 里**（`@tailwindcss/vite` 只处理 `.css`）。
  - 当前：`app/assets/css/main.css`。
- `.scss` 只放 Sass 变量、嵌套、普通 CSS 属性；**不要**在里面写 `@apply` / `@tailwind`。
  - 当前：`app/assets/css/main.scss`（自带一份 `$color-light-*` + `@layer base`；`color.scss` 已删）。
- `nuxt.config.ts` 的 `css` 数组同时加载 `main.css` 与 `main.scss`。
- 颜色调色板定义在 `app/assets/css/main.css` 的 `@theme` 里（token `--color-light-*`）。
  - 组件/模板里优先用生成出来的工具类：`bg-light-background`、`text-light-font-h`、`border-light-primary`…
  - 坑：Tailwind v4 会**按需输出** `@theme` 变量，没被任何工具类用到的 token 不会出现在 `:root` 里 → 在 SCSS 里写 `var(--color-light-secondary)` 有可能取不到值。稳妥做法是在模板里用工具类，而不是在 SCSS 里手写 `var()`。
  - 遗留：`main.scss` 里的 `$color-light-*` 与 `main.css` 的 `@theme` 是重复的两份定义，改色时要一起改。
- 坑：SCSS 里引入别的样式文件不要写 `@import url('...')`（会被当普通 CSS URL，不编译），用 `@use './x.scss' as *;`。
- 坑：`text-shadow-<color>` 只设置阴影**颜色**，必须再配一个尺寸（`text-shadow-2xs/xs/sm/md/lg`）才会显现；单独写 color 版（如 `group-hover:text-shadow-light-button-hover`）看不见效果。
- 作用域样式优先：SFC 的 `<style scoped>` 属于**未分层**样式，永远压过 `main.css` 里 `@layer components` 的同类名（如 `.doc-link`、`.btn`），即使后者特异性相同。

## 弧形（扇形）虚拟列表
- `app/components/FanVirtualList.vue`：`useVirtualList` 提供直线滚动轨道，再按 `theta = (progress - index) * itemHeight / radius` 把轨道距离换算成圆心角，条目用极坐标摆到弧上。
- 结构要点：视觉层 `position: sticky; top: 0; overflow: hidden`；`overscan ≥ maxAngle/stepDeg`；`containerProps.style` 是内联样式会压过 class，改 `overflowY` 必须重组 props 再 `v-bind`。
- 驱动：`driver = 'self' | 'window'`（默认 self）。`window` 模式 = **直接取页面进度** `scrollY/(scrollHeight-innerHeight)` × `windowSpan`（绝对值映射，无增量），并用 `watchEffect` 把轨道 scrollTop 以**绝对值**同步过去供取窗口；容器 `overflow:hidden`（脚本可滚、用户不可滚）。
- **坑（实测）**：`overflow:hidden` + `overscroll-behavior:contain` 会吞掉滚轮——轨道不滚、页面也不滚。window 模式必须 `overscroll-behavior:auto`，self 模式才用 `contain`。
- **坑**：window 模式要在 wrapper 后补一个「容器高」的尾巴（`.fan-list__tail`），否则 scrollTop 上限 = 总高−容器高，末尾几条永远到不了前位。
- 验证：Node 22 的 `fetch` + 全局 `WebSocket` 可零依赖走 CDP 驱动本机 Chrome，`Input.dispatchMouseEvent(mouseWheel)` 能产生真实滚动，适合验证滚动联动。
- 调参用 `demo/fan-list-lab.html`（真长页面 + 滑杆实时预览 + 复制组件参数），不要把参数散落在各处手调。

## Markdown 正文排版
- **Nuxt Content 3.x 的 `<ContentRenderer>` 不会自动套 `.prose`**，是平铺输出。所有正文样式必须自己包作用域：`[...slug].vue` 里用 `<div class="markdown-body">` 包住，`main.scss` 里写 `.markdown-body { … }`。否则 `ul/li/table/pre/h*` 的裸标签规则会污染首页卡片、TocFanNav、TypeDropdown。
- **实测渲染结构**（别猜，抓 SSR HTML 确认）：
  - 代码块 ` ```lang ` → `pre.language-<lang>.shiki.shiki-themes.github-light.github-dark` > `code` > `span.line[line=N]` > Shiki token span（哈希类名）。`pre` 的 inline `style` 为空、**自身没有背景**。
  - 行内代码 → **裸 `<code>`，无 class**；用 `:not(pre) > code` 与代码块区分。
  - `@nuxtjs/mdc` 自带 `ProsePre.vue` 只注入 `pre code .line{display:block}`，无冲突。
- **关键**：双主题 shiki 颜色靠注入 CSS `html .shiki span{color:var(--shiki-default)}`；本页 `html` 无 `.dark` → 用 **github-light 亮色 token**（#D73A49/#005CC5/#E36209/#24292E）。所以**代码块背景必须偏亮**（当前 `#f6f8fa`），设深色背景会让代码完全看不清。
- `main.scss` 里改色用自带的 `$color-light-*`（SCSS 变量），不要 `var(--color-light-*)`（见上面按需输出那条坑）。
- 站点级裸标签 `p/h1/h2` 规则**要保留**：BlogCard 的 `<h2>`、Counter 的 `<h3>` 还在吃它们。

## 顶部固定筛选条（首页）
- `app/pages/index.vue`：`TypeDropdown + Search` 包在 `<header class="filter-bar"> > <div class="container filter-bar__inner">`，其余内容在 `<div class="container index-body">`。
- `.filter-bar`：`position: fixed; inset: 0 0 auto 0; z-index: 50; padding-block: .75rem;` + `rgba(254,254,241,.72)` + `backdrop-filter: blur(14px) saturate(140%)`。
- 衔接处磨砂用装饰性 `&::after`（`top:100%`、`backdrop-filter: blur(10px)`、背景 rgba→透明、`mask-image: linear-gradient(#000, transparent)` 渐隐、`pointer-events:none`）。
- **坑**：别给 `.filter-bar` 本身加 `mask-image` —— mask 会连**后代一起裁**，TypeDropdown 向下弹出的面板会被渐隐。渐隐只放 `::after`，bar 保持 `overflow: visible` 无 mask。
- 对齐靠两边共用 `.container`；`.index-body` 用 `padding-top: calc(4rem + 1.25rem)` 给固定条让位（4rem = 0.75rem×2 + h-10 载体）。

## 内容查询与列表分页
- **表结构事实**（读 `.nuxt/content/sql_dump.txt` 确认，别猜）：`_content_content` 只有 `id, title, body, description, extension, meta, navigation, path, seo, stem, __hash__`。
  - **没有 `type`，没有 `date`** → `.select(...,'type')` / `.order('date',...)` 会报错。`type` 由 `getTypeFromPath(path)` 推导；按日期排序需先加 schema + front-matter。
- 首页查询：`queryCollection('content').select('path','title','description').order('path','ASC').all()` —— 不取 body（minimark AST，最重）。
  - 抓 SSR HTML 验证：`minimark` 与 `"body":` 键都消失 = 真的没取正文。
- **搜索范围因此缩小**：只剩 title/description/path/type，**正文不再参与匹配**。要全文搜索得另做索引。
- 类型：`ContentMeta`(path/title/description) → store 里拼成 `ContentDocument`(+type)；`useContentSummary` 用的是含 body 的 `ContentCollectionItem`。
- **分页用客户端增量展示**（`app/composables/useInfiniteList.ts`），不用服务端 `.skip()/.limit()`：搜索/筛选要全量元数据，数据已在 store，再分页取 = 重复取同样行。
  - **坑**：IntersectionObserver 只在进出视口时触发；加载后若哨兵仍在视口内不会再触发 → 必须 `nextTick` 后自查 rect 并递归续加载。
  - `minSpin`(320ms) 是最短展示时长，防 spinner 闪现。
- `app/components/SpinCircle.vue`：纯 CSS 转圈；颜色写死（SFC scoped 读不到 main.scss 的 `$color-*`）：#E0E0F0 / #969780。

## 页面 meta（标题 / 描述）
- **没有 `defineMeta` 这个 API**。`definePageMeta` 是**编译期宏**，参数只能是静态字面量（所以它只用来放 `layout`）；笔记 title 是 `await queryCollection()` 的运行时值 → 必须走 **`useSeoMeta` + getter**，并顺带解决客户端跳转时 head 的响应式更新与回收。
- 站点名/描述的唯一出处：`app/utils/site.ts`（`SITE_NAME` / `SITE_DESCRIPTION` / `pageTitle(标题)`）。标题格式统一 `<笔记标题> · Blog`。
- **nuxt/content 的 title/description 会自动兜底**（`sql_dump.txt` 实证）：frontmatter 没写 title → **用文件名**（`Vue/axios.md` → `Axios`）；没写 description → **用首段正文**（`about.md` → `Back home`，首块是代码块时为空 → 此时不渲染 meta 标签，别塞空串）。
- `[...slug].vue` 在正文**没有前导 h1** 时补 `<h1 class="doc-title">`：判据 = `body.value` 里第一个 `Array.isArray(n) && typeof n[0]==='string'` 的节点 tag 是不是 `'h1'`。不少笔记（axios/Pinia/Nuxt4）正文无 h1，不补的话页面「没有名字」。放 `.markdown-body` 内可白蹭现成 h1 样式。
- **路由 path 是小写的**：`content/Vue/axios.md` → `/vue/axios`；写 `/Vue/axios` 直接 404（调试时别被这个骗了）。
- 404 页的 `<title>` 是 Nuxt 默认的 `404 - Page not found | Nuxt`，没接站点名。

## 本机调试环境
- dev server 一般跑在 **3000 且只绑 IPv6** → Node 里用 `host:'::1'`，`127.0.0.1` 会 ECONNREFUSED。
- bash 里 coreutils（`ls/head/dirname`）缺失 → 文件与探测一律用 `node -e`。
- 浏览器验证：`C:/Program Files/Google/Chrome/Application/chrome.exe` + `--headless=new --remote-debugging-port=9333 --user-data-dir=<tmp>`；Node 22 全局 `WebSocket` 连 `/json/version` 的 `webSocketDebuggerUrl`，`Target.createTarget` + `attachToTarget{flatten}` + `Page.navigate` + `Runtime.evaluate`（取 `getComputedStyle` 验样式、`Input.dispatchMouseEvent` 验滚动）。`Page.captureScreenshot` 可存 PNG 后直接 Read 看图。
- 坑：`getComputedStyle(el, '::after')` **必须传第二个参数**；写成 `const cs = el => getComputedStyle(el)` 再传两个实参，第二参会被静默丢弃 → 返回宿主元素样式（会误判"伪元素没生效"）。

