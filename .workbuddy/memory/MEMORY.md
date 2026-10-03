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
- **path 现在由 `modules/content-path-preserve.ts` 用「文件自身路径」写死**：在 `content:file:beforeParse`
  里往 frontmatter 注入 `path:`。原先靠 `content.build.pathMeta.slugifyOptions.remove` 保中文，那条配置已删。
- **钩子位置是最大的坑**：`content:file:beforeParse` / `content:file:afterParse` 由 @nuxt/content 走
  `nuxt.callHook(...)` 触发，是**构建期 Nuxt 钩子**，不是 Nitro 运行时钩子 ——
  写在 `server/plugins/*.ts` 的 `defineNitroPlugin` **永远不会被调用**，必须放 `modules/`（Nuxt 自动加载、
  且 `.nuxt/tsconfig.node.json` 的 include 已含 `modules/**`）。不要 import `@nuxt/kit` 之外的东西。
- **v3 的 frontmatter 字段是 `path`**（v2 才叫 `_path`）；pathMeta 里 `...content` 展开在计算之后，
  所以 frontmatter 的 `path` / `title` 天然优先，插件只补「没写 path」的文件（用 `^[ \t]*path[ \t]*:` 判断）。
- 钩子参数里 `file.path` 是**绝对文件路径**，`file.id` 才是 `content/cpp/opengel/光照.md` 这种键 —— 用 `file.id`。
- **逐字路径的代价**：大小写、空格、`+` 全保留 ⇒ 109/134 条 URL 与旧 slugify 形态不同
  （`/vue/nuxt/nuxt4` → `/Vue/Nuxt/Nuxt4`，`/cpp/boost/cpp-boost` → `/cpp/boost/C++ Boost`）。
  想回到旧形态：删掉该模块 + 把 `pathMeta.slugifyOptions.remove` 加回 nuxt.config.ts。
- 文件名里别出现 `#`、`?`、`%`（破坏 URL/YAML）；`C#的多线程.md` → `CSharp的多线程.md` 这类重命名仍然必要。
- 自检：`.data/content/contents.sqlite` → `SELECT id,path,title FROM _content_content`：
  行数 = md 文件数、path 无重复、且 `path = '/' + id.slice('content/'.length, -3)`。
- **`route.path` 是 percent-encoded**（中文 `%E4%B8%89`、`+` 变 `%2B`），库里是解码原文 —— 见下面「URL / 路径约定」。

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
- 首页 `index.vue` 直接渲染全部文章（**无分页**）→ 首屏 SSR 输出全部文档链接 → Nitro `crawlLinks` 从 `/` 就能爬全，
  `nuxt.config.ts` 只需要 `nitro: { preset: 'static', prerender: { crawlLinks: true, routes: ['/'], failOnError: false } }`。
- **不要再引入读 sqlite 的 `prerender:routes` 钩子**：那是「首页只 SSR 10 条链接」时的补丁，
  分页去掉后纯属多余，还额外要求 better-sqlite3 原生模块可用。只有首页重新加回分页时才会再次需要。
- **别用 `meta/<id>.json` 的 `prerendered` 数组校验**：它只记录「显式 add 进列表的路由」，
  crawlLinks 抓来的不计入 —— 线上现状是 `prerendered: []` 而 134 个文档页都是好的。
  校验改看产物目录里有没有 `xxx/index.html`，或线上抽查文档页的 `<title>` 是否等于首页标题（等于 = 回退）。
- 爬虫会从正文里抓出伪路由（如 `/vue/目录`、裸 `<router-link>`）报 404，`failOnError: false` 下不阻塞，属噪音。

## URL / 路径约定
- 比较或查询路径前一律过 `app/utils/path.ts` 的 `canonicalPath()`（解码 + 去尾斜杠）：
  `route.path/fullPath` 是 percent-encoded，内容库与 `item.path` 是解码原文。
  已用在：`[...slug].vue` 内容查询与 reader.path、`RightTabWithNav` 的 isActive、导航栈中间件。
- **禁止在 app 侧对尾斜杠做重定向**去「修正」地址栏：nginx 会 301 补斜杠，app 再 301 去掉 = 死循环。
- Nitro 静态产物是 `xxx/index.html`，所以 `/xxx` 会被 nginx 目录索引 301 成 `/xxx/`，属机制行为。

