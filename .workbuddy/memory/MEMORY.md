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
- 仓库里有 on-save 格式化（会把空 `catch` 里的注释抹掉）：别靠注释过 `no-empty`，写真实语句。
- Prettier 配置在 `prettier.config.mjs`，但仓库现有代码跟它不一致（大量文件 `--check` 不过）；
  **不要随手 `prettier --write`**，会搅出无关 diff。

## 内容路径（@nuxt/content）
- **path 由 slugify 生成**，会把中文整段删掉（`\w` 不含 CJK）→ 大量中文名文件塌成同一 path
  （opengel 13 篇 → `/cpp/opengel`；`*C++*` → `/cpp/c++`；`C#的*` → `/csharp/c` …），
  `.path(x).first()` 于是永远返回第一篇。**新增中文笔记前先确认这里没退化。**
- 入口：`nuxt.config.ts` 的 `content.build.pathMeta.slugifyOptions.remove`，
  现在是把 CJK 加回白名单：`/[^\w\s$*_+~.()'"!\-:@\u4e00-\u9fff]+/g`。
- slugify 的 **charMap 改不掉**（`$`→`dollar`、`元`→`yuan`、`円`→`yen`）：想干净只能改文件名，
  或给该文件加 `path: /想要的/路径` frontmatter（会覆盖生成的 path）。
- 中文名笔记重命名时要在文件顶部补 `title: "..."`（**引号必须有**，`#` 在 YAML 里是注释）
  来保住展示名；`h1` 来自正文的行不受影响。
- **`route.path` 是 percent-encoded**（中文 `%E4%B8%89`、`+` 变 `%2B`），库里 `path` 是解码原文；
  `[...slug].vue` 必须先 `decodeURIComponent(route.path)` 再 `queryCollection().path()`。
- 自检：`.data/content/contents.sqlite` 用 node `--experimental-sqlite` 直读，
  `SELECT path,title FROM _content_content` 里若出现重复 path 就是这个问题。

## 组件 / composable 分工
- 分享：`composables/useShareNote.ts`（Web Share API → 复制链接兜底，自己调 `useNotice`）；
  组件只写 `@click="shareNote"`。
- 轻提示：状态 `composables/useNotice.ts` + UI `components/Notice.vue`，全局只在 `app.vue` 挂一份。
- 文档页的数据通道只有 `stores/reader.ts`（layout 与 page 是兄弟关系）：
  slug 页 `setArticle({ path, title, description, toc })`。
- `FloatingMenu.vue` = 返回/分享两个按钮；`ThemeToggle.vue` = 明暗切换，同高右侧。

## 验证手法（Vue/Nuxt 页面）
- Node 22 全局 `WebSocket` + `fetch` 可零依赖走 CDP 驱动本机 headless Chrome。
  脚本用 `node --input-type=module - <<'EOF'` 从 stdin 喂进去（不留文件），抓
  `Runtime.consoleAPICalled`（含 `stackTrace`）能直接定位是哪个组件的警告。
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
- 静态构建必须显式枚举内容路由，否则只预渲染「首页爬到的那几条」：
  Nitro 的 crawlLinks 种子只有 '/'，而首页 index.vue 用 useInfiniteList（PAGE_SIZE=10），
  首屏 SSR 只有 10 条链接 → 只产出 11 个页面，其余全部 404。
- 做法：nuxt.config.ts 的 hooks['nitro:init'] 里注册 nitro.hooks.hook('prerender:routes')，
  读 .data/content/contents.sqlite 的 _content_content.path 全量 add，并手动 routes.add('/')。
- 校验：产物 .output/public/_nuxt/builds/meta/<id>.json 里的 prerendered 数量应 = 内容条数 + 1。
- nginx 的 try_files 回退会把缺失的文档页静默换成首页，
  所以「显示 404」和「静默停在首页」可能是同一个原因。
