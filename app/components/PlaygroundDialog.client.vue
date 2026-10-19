<template>
  <Dialog v-model="isOpen" panel-class="playground-dialog">
    <div class="pg">
      <!-- 顶部工具栏：左侧语言选择 + 文件名，右侧重置 / 运行 / 关闭 -->
      <header class="pg-header">
        <div class="pg-header__left">
          <div ref="langDropdownRef" class="lang-select relative">
            <button
              type="button"
              class="lang-select__trigger"
              :aria-expanded="langMenuOpen"
              aria-haspopup="listbox"
              @click="langMenuOpen = !langMenuOpen"
            >
              <span class="icon" :style="codeIconStyle" aria-hidden="true" />
              <span class="lang-select__label">{{ currentLangLabel }}</span>
              <svg
                class="lang-select__caret"
                :class="{ 'lang-select__caret--open': langMenuOpen }"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M2 4.5 6 8.5 10 4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <Transition name="td">
              <div
                v-if="langMenuOpen"
                class="lang-select__panel"
                role="listbox"
                :aria-label="t('playground.selectLanguage')"
              >
                <button
                  v-for="item in languageOptions"
                  :key="item.value"
                  type="button"
                  role="option"
                  class="lang-select__item"
                  :class="{ 'lang-select__item--active': language === item.value }"
                  :aria-selected="language === item.value"
                  @click="selectLanguage(item.value)"
                >
                  <span>{{ item.label }}</span>
                  <span v-if="item.badge" class="lang-select__badge">{{ item.badge }}</span>
                </button>
              </div>
            </Transition>
          </div>

          <span v-if="filename" class="pg-filename">{{ filename }}</span>
        </div>

        <div class="pg-header__actions">
          <button
            type="button"
            class="btn pg-btn"
            :title="t('playground.reset')"
            :aria-label="t('playground.reset')"
            @click="handleReset"
          >
            <span class="icon" :style="restartIconStyle" aria-hidden="true" />
            <span class="pg-btn__label">{{ t('playground.reset') }}</span>
          </button>

          <button
            type="button"
            class="btn pg-btn pg-btn--run"
            :disabled="running"
            :title="t('playground.runShortcut')"
            :aria-label="t('playground.run')"
            @click="handleRun"
          >
            <span class="icon" :style="playIconStyle" aria-hidden="true" />
            <span class="pg-btn__label">{{
              running ? t('playground.running') : t('playground.run')
            }}</span>
          </button>

          <button
            type="button"
            class="btn pg-btn pg-btn--icon"
            :title="t('playground.close')"
            :aria-label="t('playground.close')"
            @click="closePlayground"
          >
            <span class="icon" :style="closeIconStyle" aria-hidden="true" />
          </button>
        </div>
      </header>

      <!-- 主体分栏：左侧 Monaco IDE 区域（Web 模式下带 HTML/CSS/JS Tab），右侧 iframe 预览或控制台输出 -->
      <div class="pg-body">
        <section class="pg-editor-pane" :aria-label="t('playground.editorAria')">
          <!-- Web 模式专属顶部 HTML / CSS / JS 标签栏 -->
          <div v-if="isWebMode" class="pg-web-tabs" role="tablist">
            <button
              v-for="tab in webTabOptions"
              :key="tab.value"
              type="button"
              role="tab"
              class="pg-web-tab"
              :class="{ 'pg-web-tab--active': activeWebTab === tab.value }"
              :aria-selected="activeWebTab === tab.value"
              @click="handleSelectWebTab(tab.value)"
            >
              <span class="pg-web-tab__ext" :class="`pg-web-tab__ext--${tab.value}`">{{
                tab.badge
              }}</span>
              <span>{{ tab.label }}</span>
              <span v-if="hasWebTabContent(tab.value)" class="pg-web-tab__dot" aria-hidden="true" />
            </button>
          </div>

          <div class="pg-editor-wrap">
            <div v-if="editorLoading" class="pg-editor-loading">
              <SpinCircle />
            </div>
            <div ref="editorContainerRef" class="pg-editor-host" />
          </div>
        </section>

        <!-- 右侧：Web 模式下为实时 iframe 预览 + 底部可折叠控制台；其他语言为纯控制台输出 -->
        <section class="pg-output-pane" :aria-label="t('playground.outputAria')">
          <template v-if="isWebMode">
            <div class="pg-output-header">
              <div class="pg-output-header__meta">
                <span class="pg-output-title">{{ t('playground.preview') }}</span>
                <span class="pg-duration">HTML / CSS / JS</span>
              </div>

              <div class="pg-output-header__right">
                <button
                  type="button"
                  class="pg-console-toggle"
                  :class="{ 'pg-console-toggle--active': webConsoleOpen }"
                  @click="webConsoleOpen = !webConsoleOpen"
                >
                  <span>{{ t('playground.console') }}</span>
                  <span
                    v-if="logs.length || errorMsg"
                    class="pg-console-badge"
                    :class="{ 'pg-console-badge--error': Boolean(errorMsg) }"
                  >
                    {{ errorMsg ? '!' : logs.length }}
                  </span>
                </button>
              </div>
            </div>

            <div class="pg-preview-stage">
              <iframe
                ref="previewIframeRef"
                class="pg-preview-iframe"
                title="Playground Web Preview"
                sandbox="allow-scripts allow-modals"
                :srcdoc="iframeSrcDoc"
              />
            </div>

            <!-- Web 模式底部可折叠 Console 抽屉 -->
            <div v-if="webConsoleOpen" class="pg-web-console">
              <div class="pg-output-header pg-web-console__header">
                <span class="pg-output-title">{{ t('playground.console') }}</span>
                <button
                  type="button"
                  class="pg-clear-btn"
                  :title="t('playground.clear')"
                  :aria-label="t('playground.clear')"
                  @click="clearOutput"
                >
                  <span class="icon" :style="trashIconStyle" aria-hidden="true" />
                  <span class="pg-clear-btn__label">{{ t('playground.clear') }}</span>
                </button>
              </div>

              <div class="pg-output-body pg-web-console__body">
                <p v-if="!logs.length && !errorMsg" class="pg-output-empty">
                  {{ t('playground.emptyOutput') }}
                </p>

                <div
                  v-for="(entry, idx) in logs"
                  :key="idx"
                  class="pg-log-item"
                  :class="`pg-log-item--${entry.level}`"
                >
                  <pre class="pg-log-text">{{ entry.text }}</pre>
                </div>

                <div v-if="errorMsg" class="pg-log-item pg-log-item--error">
                  <pre class="pg-log-text">{{ errorMsg }}</pre>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="pg-output-header">
              <div class="pg-output-header__meta">
                <span class="pg-output-title">{{ t('playground.output') }}</span>
                <span v-if="lastDurationMs !== null" class="pg-duration">
                  {{ lastDurationMs }} ms
                </span>
              </div>

              <button
                type="button"
                class="pg-clear-btn"
                :title="t('playground.clear')"
                :aria-label="t('playground.clear')"
                @click="clearOutput"
              >
                <span class="icon" :style="trashIconStyle" aria-hidden="true" />
                <span class="pg-clear-btn__label">{{ t('playground.clear') }}</span>
              </button>
            </div>

            <div class="pg-output-body">
              <p v-if="!logs.length && !errorMsg && !running" class="pg-output-empty">
                {{ t('playground.emptyOutput') }}
              </p>

              <div
                v-for="(entry, idx) in logs"
                :key="idx"
                class="pg-log-item"
                :class="`pg-log-item--${entry.level}`"
              >
                <pre class="pg-log-text">{{ entry.text }}</pre>
              </div>

              <div v-if="errorMsg" class="pg-log-item pg-log-item--error">
                <pre class="pg-log-text">{{ errorMsg }}</pre>
              </div>
            </div>
          </template>
        </section>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { PlaygroundLanguage, WebFiles, WebTab } from '~/composables/usePlayground'
import { usePlayground } from '~/composables/usePlayground'
import { DEFAULT_LANGUAGE_SNIPPETS } from '~/stores/playground'
import { useTheme } from '~/composables/useTheme'
import type {
  ConsoleEntry,
  runPlaygroundCode,
  validateCSharpCode,
  ensureCSharpRunner,
  ensureClangCompiler,
  type RunDiagnostic
} from '~/utils/code-runner'
import { registerCSharpIntelliSense } from '~/utils/csharp-intellisense'
import { registerCppIntelliSense } from '~/utils/cpp-intellisense'

import playIcon from '~/assets/image/play-svgrepo-com.svg'
import restartIcon from '~/assets/image/restart-svgrepo-com.svg'
import closeIcon from '~/assets/image/close-circle-svgrepo-com.svg'
import trashIcon from '~/assets/image/trash-bin-trash-svgrepo-com.svg'
import codeIcon from '~/assets/image/code-square-svgrepo-com.svg'

const { t } = useI18n()
const { isDark } = useTheme()
const {
  isOpen,
  code,
  language,
  filename,
  langCodeMap,
  activeWebTab,
  webFiles,
  isWebMode,
  setWebTab,
  resetCode,
  closePlayground
} = usePlayground()

const langDropdownRef = ref<HTMLElement | null>(null)
const langMenuOpen = ref(false)
onClickOutside(langDropdownRef, () => {
  langMenuOpen.value = false
})

const languageOptions: Array<{ value: PlaygroundLanguage; label: string; badge?: string }> = [
  { value: 'html', label: 'Web (HTML/CSS/JS)', badge: 'DOM' },
  { value: 'typescript', label: 'TypeScript', badge: 'TS' },
  { value: 'javascript', label: 'JavaScript', badge: 'JS' },
  { value: 'csharp', label: 'C# (.NET)', badge: 'WASM' },
  { value: 'c', label: 'C (Clang)', badge: 'WASM' },
  { value: 'cpp', label: 'C++ (Clang)', badge: 'WASM' }
]

const webTabOptions: Array<{ value: WebTab; label: string; badge: string }> = [
  { value: 'html', label: 'index.html', badge: 'HTML' },
  { value: 'css', label: 'style.css', badge: 'CSS' },
  { value: 'javascript', label: 'script.js', badge: 'JS' }
]

function hasWebTabContent(tab: WebTab): boolean {
  return Boolean(webFiles.value[tab]?.trim())
}

const currentLangLabel = computed(
  () => languageOptions.find((o) => o.value === language.value)?.label ?? 'TypeScript'
)

function makeMaskStyle(url: string) {
  return {
    '-webkit-mask-image': `url("${url}")`,
    'mask-image': `url("${url}")`
  }
}

const playIconStyle = makeMaskStyle(playIcon)
const restartIconStyle = makeMaskStyle(restartIcon)
const closeIconStyle = makeMaskStyle(closeIcon)
const trashIconStyle = makeMaskStyle(trashIcon)
const codeIconStyle = makeMaskStyle(codeIcon)

// 运行输出状态
const running = ref(false)
const logs = ref<ConsoleEntry[]>([])
const errorMsg = ref<string>('')
const lastDurationMs = ref<number | null>(null)

// Web 预览状态（iframe srcdoc + 底部可折叠控制台）
const previewIframeRef = ref<HTMLIFrameElement | null>(null)
const iframeSrcDoc = ref('')
const webConsoleOpen = ref(false)
let webPreviewTimer: ReturnType<typeof setTimeout> | null = null
let previewRunSeq = 0

function clearOutput() {
  logs.value = []
  errorMsg.value = ''
  lastDurationMs.value = null
}

/**
 * 构建注入到右侧 iframe 的完整文档：
 * - 包含 #pg-live-style 标签，支持修改 CSS Tab 时通过 postMessage 零闪烁热更新
 * - 包含 console 与异常拦截桥接脚本，将 JS Tab 的日志实时同步回父窗口
 */
function buildIframeDocument(files: WebFiles, seq: number): string {
  const closeScriptTag = '</scr' + 'ipt>'
  const safeJs = files.javascript.replace(/<\/script>/gi, '<\\/script>')
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style id="pg-base-style">
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f1f29;
      background: transparent;
    }
  </style>
  <style id="pg-live-style">${files.css}</style>
  <script>
    (function() {
      var formatVal = function(v) {
        if (v === undefined) return 'undefined';
        if (v === null) return 'null';
        if (typeof v === 'string') return v;
        if (v instanceof Error) return v.stack || (v.name + ': ' + v.message);
        if (typeof v === 'object') {
          try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
        }
        return String(v);
      };
      var send = function(type, payload) {
        try {
          window.parent.postMessage(Object.assign({ source: 'kiriyama-pg-iframe', seq: ${seq}, type: type }, payload), '*');
        } catch (e) {}
      };
      ['log', 'info', 'warn', 'error'].forEach(function(level) {
        var orig = console[level];
        console[level] = function() {
          var args = Array.prototype.slice.call(arguments);
          send('log', { level: level, text: args.map(formatVal).join(' '), timestamp: Date.now() });
          if (orig) orig.apply(console, args);
        };
      });
      window.addEventListener('error', function(e) {
        send('error', { error: e.message || 'Runtime Error' });
      });
      window.addEventListener('unhandledrejection', function(e) {
        send('error', { error: 'Unhandled Promise Rejection: ' + formatVal(e.reason) });
      });
      window.addEventListener('message', function(e) {
        if (e.data && e.data.type === 'pg-update-css') {
          var styleEl = document.getElementById('pg-live-style');
          if (styleEl) styleEl.textContent = e.data.css;
        }
      });
    })();
  ${closeScriptTag}
</head>
<body>
${files.html}
<script>
try {
${safeJs}
} catch (err) {
  window.parent.postMessage({
    source: 'kiriyama-pg-iframe',
    seq: ${seq},
    type: 'error',
    error: err instanceof Error ? (err.stack || err.message) : String(err)
  }, '*');
}
${closeScriptTag}
</body>
</html>`
}

function rebuildWebPreviewImmediate() {
  if (webPreviewTimer) {
    clearTimeout(webPreviewTimer)
    webPreviewTimer = null
  }
  clearOutput()
  iframeSrcDoc.value = buildIframeDocument(webFiles.value, ++previewRunSeq)
}

function scheduleWebPreviewUpdate(changedTab: WebTab) {
  // 如果仅修改了 CSS Tab，且 iframe 已经渲染，直接通过 postMessage 热更新样式（0ms 无闪烁，保留 DOM 状态与动画）
  if (changedTab === 'css' && iframeSrcDoc.value && previewIframeRef.value?.contentWindow) {
    previewIframeRef.value.contentWindow.postMessage(
      {
        type: 'pg-update-css',
        css: webFiles.value.css
      },
      '*'
    )
    return
  }

  if (webPreviewTimer) {
    clearTimeout(webPreviewTimer)
  }
  webPreviewTimer = setTimeout(() => {
    rebuildWebPreviewImmediate()
  }, 320)
}

function handleIframeMessage(event: MessageEvent) {
  const data = event.data
  if (!data || data.source !== 'kiriyama-pg-iframe' || data.seq !== previewRunSeq) return

  if (data.type === 'log') {
    logs.value.push({
      level: data.level ?? 'log',
      text: data.text ?? '',
      timestamp: data.timestamp ?? Date.now()
    })
  } else if (data.type === 'error') {
    errorMsg.value = data.error ?? 'Error in preview script'
    webConsoleOpen.value = true
  }
}

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

// Monaco Editor 按需加载与多 Model 实例管理
const editorContainerRef = ref<HTMLElement | null>(null)
const editorLoading = ref(false)

type MonacoModule = typeof import('monaco-editor')
type MonacoEditorInstance = import('monaco-editor').editor.IStandaloneCodeEditor
type MonacoTextModel = import('monaco-editor').editor.ITextModel
type MonacoViewState = import('monaco-editor').editor.ICodeEditorViewState

let monacoMod: MonacoModule | null = null
const editorInstance = shallowRef<MonacoEditorInstance | null>(null)
let themesDefined = false
let suppressContentChange = false

// Web 模式下常驻的 3 个 Model 与对应的光标/滚动/撤回栈状态（对标 VS Code 标签页架构）
const webModels: Partial<Record<WebTab, MonacoTextModel>> = {}
const webViewStates: Partial<Record<WebTab, MonacoViewState | null>> = {}

async function ensureMonacoLoaded(): Promise<MonacoModule> {
  if (monacoMod) return monacoMod

  editorLoading.value = true
  try {
    const monaco = await import('monaco-editor')

    if (!themesDefined) {
      monaco.editor.defineTheme('kiriyama-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#f6f8fa',
          'editorGutter.background': '#f6f8fa',
          'editor.lineHighlightBackground': '#f0f0fe90',
          'editorLineNumber.foreground': '#6e6e70',
          'editorLineNumber.activeForeground': '#212122',
          'editor.selectionBackground': '#d6d8b799',
          'editorOverviewRuler.border': '#00000000'
        }
      })

      monaco.editor.defineTheme('kiriyama-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': '#1f1f29',
          'editorGutter.background': '#1f1f29',
          'editor.lineHighlightBackground': '#24242f90',
          'editorLineNumber.foreground': '#9b9ba8',
          'editorLineNumber.activeForeground': '#fdfdf7',
          'editor.selectionBackground': '#34372acc',
          'editorOverviewRuler.border': '#00000000'
        }
      })

      const tsNs = monaco.typescript ?? monaco.languages?.typescript
      if (tsNs) {
        tsNs.typescriptDefaults.setCompilerOptions({
          target: tsNs.ScriptTarget.ESNext,
          module: tsNs.ModuleKind.ESNext,
          moduleResolution: tsNs.ModuleResolutionKind.NodeJs,
          allowNonTsExtensions: true,
          strict: true,
          noEmit: false
        })
        tsNs.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false
        })
      }

      registerCSharpIntelliSense(monaco)
      registerCppIntelliSense(monaco)

      themesDefined = true
    }

    monacoMod = monaco
    return monaco
  } finally {
    editorLoading.value = false
  }
}

const LANG_EXT_MAP: Record<Exclude<PlaygroundLanguage, 'html'>, string> = {
  typescript: 'ts',
  javascript: 'js',
  csharp: 'cs',
  c: 'c',
  cpp: 'cpp'
}

let modelSeq = 0
let csharpValidateTimer: ReturnType<typeof setTimeout> | null = null

function createFreshCodeModel(
  monaco: MonacoModule,
  value: string,
  lang: Exclude<PlaygroundLanguage, 'html'>
): MonacoTextModel {
  const ext = LANG_EXT_MAP[lang] ?? 'ts'
  const uri = monaco.Uri.parse(`inmemory://playground/snippet-${++modelSeq}.${ext}`)
  return monaco.editor.createModel(value, lang, uri)
}

function ensureWebModels(monaco: MonacoModule) {
  const tabs: Array<{ tab: WebTab; ext: string }> = [
    { tab: 'html', ext: 'html' },
    { tab: 'css', ext: 'css' },
    { tab: 'javascript', ext: 'js' }
  ]
  for (const { tab, ext } of tabs) {
    if (!webModels[tab] || webModels[tab]!.isDisposed()) {
      const uri = monaco.Uri.parse(`inmemory://playground/web-${++modelSeq}.${ext}`)
      webModels[tab] = monaco.editor.createModel(webFiles.value[tab], tab, uri)
    } else if (webModels[tab]!.getValue() !== webFiles.value[tab]) {
      webModels[tab]!.setValue(webFiles.value[tab])
    }
  }
}

function disposeWebModels() {
  for (const tab of ['html', 'css', 'javascript'] as WebTab[]) {
    webModels[tab]?.dispose()
    webModels[tab] = undefined
    webViewStates[tab] = undefined
  }
}

function handleSelectWebTab(nextTab: WebTab) {
  if (activeWebTab.value === nextTab || !editorInstance.value || !monacoMod) return

  // 1. 保存当前 Tab 的光标、选中区域与滚动位置
  webViewStates[activeWebTab.value] = editorInstance.value.saveViewState()

  // 2. 更新 Pinia Store 中的激活 Tab 并切换 Model
  setWebTab(nextTab)
  ensureWebModels(monacoMod)
  const targetModel = webModels[nextTab]!

  suppressContentChange = true
  try {
    editorInstance.value.setModel(targetModel)
  } finally {
    suppressContentChange = false
  }

  // 3. 恢复目标 Tab 的光标与滚动状态
  if (webViewStates[nextTab]) {
    editorInstance.value.restoreViewState(webViewStates[nextTab]!)
  }
  editorInstance.value.focus()
}

function applyCompilerMarkers(
  owner: Exclude<PlaygroundLanguage, 'html'>,
  diagnostics: RunDiagnostic[]
) {
  if (!monacoMod || !editorInstance.value || language.value !== owner) return
  const model = editorInstance.value.getModel()
  if (!model) return

  const markers = diagnostics.map((d) => {
    const line = Math.min(Math.max(1, d.line ?? 1), model.getLineCount())
    const col = Math.max(1, d.column ?? 1)
    const maxCol = model.getLineMaxColumn(line)
    return {
      severity:
        d.severity === 'warning'
          ? monacoMod!.MarkerSeverity.Warning
          : monacoMod!.MarkerSeverity.Error,
      message: d.id ? `${d.id}: ${d.message}` : d.message,
      startLineNumber: line,
      startColumn: col,
      endLineNumber: line,
      endColumn: Math.max(col + 1, maxCol)
    }
  })
  monacoMod.editor.setModelMarkers(model, owner, markers)
}

function scheduleCSharpValidation(source: string) {
  if (csharpValidateTimer) {
    clearTimeout(csharpValidateTimer)
    csharpValidateTimer = null
  }
  if (language.value !== 'csharp') return
  csharpValidateTimer = setTimeout(async () => {
    if (!isOpen.value || language.value !== 'csharp' || running.value) return
    const diagnostics = await validateCSharpCode(source)
    if (
      isOpen.value &&
      language.value === 'csharp' &&
      editorInstance.value?.getValue() === source
    ) {
      applyCompilerMarkers('csharp', diagnostics)
    }
  }, 650)
}

async function mountOrSyncEditor() {
  if (!isOpen.value) return
  await nextTick()
  const container = editorContainerRef.value
  if (!container) return

  const monaco = await ensureMonacoLoaded()
  if (!isOpen.value || !editorContainerRef.value) return

  let targetModel: MonacoTextModel
  if (language.value === 'html') {
    ensureWebModels(monaco)
    targetModel = webModels[activeWebTab.value]!
  } else {
    targetModel = createFreshCodeModel(monaco, code.value, language.value)
  }

  if (!editorInstance.value) {
    const editor = monaco.editor.create(editorContainerRef.value, {
      model: targetModel,
      theme: isDark.value ? 'kiriyama-dark' : 'kiriyama-light',
      automaticLayout: true,
      colorDecorators: true,
      minimap: { enabled: false },
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      fontSize: 13.5,
      lineHeight: 22,
      fontFamily:
        "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      padding: { top: 16, bottom: 16 },
      scrollBeyondLastLine: false,
      tabSize: 2,
      smoothScrolling: true,
      cursorBlinking: 'smooth'
    })

    editor.onDidChangeModelContent(() => {
      if (suppressContentChange) return
      const val = editor.getValue()

      if (language.value === 'html') {
        const currentTab = activeWebTab.value
        if (webFiles.value[currentTab] !== val) {
          webFiles.value[currentTab] = val
          scheduleWebPreviewUpdate(currentTab)
        }
        return
      }

      if (val !== code.value) {
        code.value = val
      }
      langCodeMap.value[language.value] = val

      if (language.value === 'csharp') {
        scheduleCSharpValidation(val)
      } else if (monacoMod && (language.value === 'c' || language.value === 'cpp')) {
        const model = editor.getModel()
        if (model) {
          monacoMod.editor.setModelMarkers(model, language.value, [])
        }
      }
    })

    // 快捷键 Ctrl+Enter / Cmd+Enter 直接运行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun()
    })

    editorInstance.value = editor
  } else {
    const oldModel = editorInstance.value.getModel()
    suppressContentChange = true
    try {
      editorInstance.value.setModel(targetModel)
    } finally {
      suppressContentChange = false
    }
    const isOldWebModel = Object.values(webModels).includes(oldModel ?? undefined)
    if (oldModel && !isOldWebModel && oldModel !== targetModel) {
      oldModel.dispose()
    }
    monaco.editor.setTheme(isDark.value ? 'kiriyama-dark' : 'kiriyama-light')
  }
}

function disposeEditor() {
  if (csharpValidateTimer) {
    clearTimeout(csharpValidateTimer)
    csharpValidateTimer = null
  }
  if (webPreviewTimer) {
    clearTimeout(webPreviewTimer)
    webPreviewTimer = null
  }
  if (editorInstance.value) {
    const currentModel = editorInstance.value.getModel()
    const isCurrentWebModel = Object.values(webModels).includes(currentModel ?? undefined)
    editorInstance.value.dispose()
    if (currentModel && !isCurrentWebModel) {
      currentModel.dispose()
    }
    editorInstance.value = null
  }
  disposeWebModels()
}

watch(isOpen, async (open) => {
  if (open) {
    clearOutput()
    webConsoleOpen.value = false
    await mountOrSyncEditor()

    if (language.value === 'html') {
      rebuildWebPreviewImmediate()
    } else if (language.value === 'typescript' || language.value === 'javascript') {
      await handleRun()
    } else if (language.value === 'csharp') {
      ensureCSharpRunner()
        .then(() => scheduleCSharpValidation(code.value))
        .catch(() => {})
    } else if (language.value === 'c' || language.value === 'cpp') {
      ensureClangCompiler(language.value).catch(() => {})
    }
  } else {
    langMenuOpen.value = false
    disposeEditor()
  }
})

watch(isDark, (dark) => {
  if (monacoMod) {
    monacoMod.editor.setTheme(dark ? 'kiriyama-dark' : 'kiriyama-light')
  }
})

watch(language, (newLang, oldLang) => {
  if (oldLang && oldLang !== 'html' && editorInstance.value) {
    langCodeMap.value[oldLang] = editorInstance.value.getValue()
  } else if (oldLang === 'html' && editorInstance.value) {
    webViewStates[activeWebTab.value] = editorInstance.value.saveViewState()
  }

  clearOutput()

  if (newLang === 'html') {
    if (monacoMod && editorInstance.value) {
      const oldModel = editorInstance.value.getModel()
      ensureWebModels(monacoMod)
      const nextModel = webModels[activeWebTab.value]!
      suppressContentChange = true
      try {
        editorInstance.value.setModel(nextModel)
      } finally {
        suppressContentChange = false
      }
      const isOldWebModel = Object.values(webModels).includes(oldModel ?? undefined)
      if (oldModel && !isOldWebModel) {
        oldModel.dispose()
      }
      if (webViewStates[activeWebTab.value]) {
        editorInstance.value.restoreViewState(webViewStates[activeWebTab.value]!)
      }
    }
    rebuildWebPreviewImmediate()
    return
  }

  const targetCode = langCodeMap.value[newLang] ?? DEFAULT_LANGUAGE_SNIPPETS[newLang]
  code.value = targetCode

  if (monacoMod && editorInstance.value) {
    const oldModel = editorInstance.value.getModel()
    const nextModel = createFreshCodeModel(monacoMod, targetCode, newLang)
    suppressContentChange = true
    try {
      editorInstance.value.setModel(nextModel)
    } finally {
      suppressContentChange = false
    }
    const isOldWebModel = Object.values(webModels).includes(oldModel ?? undefined)
    if (oldModel && !isOldWebModel) {
      oldModel.dispose()
    }
  }

  if (newLang === 'csharp') {
    ensureCSharpRunner()
      .then(() => scheduleCSharpValidation(targetCode))
      .catch(() => {})
  } else if (newLang === 'c' || newLang === 'cpp') {
    ensureClangCompiler(newLang).catch(() => {})
  }
})

function selectLanguage(lang: PlaygroundLanguage) {
  language.value = lang
  langMenuOpen.value = false
}

function handleReset() {
  resetCode()
  if (language.value === 'html') {
    if (monacoMod) {
      suppressContentChange = true
      try {
        ensureWebModels(monacoMod)
      } finally {
        suppressContentChange = false
      }
    }
    rebuildWebPreviewImmediate()
    return
  }

  if (editorInstance.value && editorInstance.value.getValue() !== code.value) {
    suppressContentChange = true
    try {
      editorInstance.value.setValue(code.value)
    } finally {
      suppressContentChange = false
    }
  }
  clearOutput()
}

async function handleRun() {
  if (language.value === 'html') {
    rebuildWebPreviewImmediate()
    return
  }

  if (running.value) return
  running.value = true
  clearOutput()
  try {
    const currentCode = editorInstance.value ? editorInstance.value.getValue() : code.value
    const result = await runPlaygroundCode(language.value, currentCode)
    logs.value = result.entries
    errorMsg.value = result.error ?? ''
    lastDurationMs.value = result.durationMs

    if (language.value === 'csharp' || language.value === 'c' || language.value === 'cpp') {
      applyCompilerMarkers(language.value, result.diagnostics ?? [])
    }
  } finally {
    running.value = false
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('message', handleIframeMessage)
  disposeEditor()
})
</script>

<style lang="scss" scoped>
/* 覆盖父组件 Dialog 的默认小卡片尺寸，变成宽屏双栏 Playground 面板 */
:global(.dialog.playground-dialog) {
  width: min(1140px, 94vw);
  height: min(720px, 86vh);
  max-height: 88vh;
  padding: 0;
  overflow: hidden;
  background-color: var(--ui-canvas);
  border: 1px solid var(--ui-line);
  border-radius: 0.875rem;
  box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.45);
}

.pg {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  color: var(--ui-text);
}

.pg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.625rem 1rem;
  background-color: var(--ui-canvas);
  border-bottom: 1px solid var(--ui-line);
  flex-shrink: 0;
}

.pg-header__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.pg-filename {
  font-size: 0.8125rem;
  color: var(--ui-text-muted);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pg-header__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* 语言选择下拉框（全部走 main.css 的 --ui-menu* 变量，随 .dark 自动切换） */
.lang-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--ui-menu-border);
  background-color: var(--ui-menu);
  color: var(--ui-text);
  transition:
    background-color 0.18s,
    border-color 0.18s;

  &:hover {
    background-color: var(--ui-menu-hover);
  }
}

.lang-select__caret {
  width: 0.75rem;
  height: 0.75rem;
  transition: transform 0.18s ease;
}

.lang-select__caret--open {
  transform: rotate(180deg);
}

.lang-select__panel {
  position: absolute;
  left: 0;
  top: 100%;
  z-index: 60;
  margin-top: 0.375rem;
  width: 12.75rem;
  padding: 0.375rem;
  border-radius: 0.875rem;
  border: 1px solid var(--ui-menu-border);
  background-color: var(--ui-menu);
  box-shadow: 0 12px 28px -8px rgb(0 0 0 / 0.25);
}

.lang-select__item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: var(--ui-text);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--ui-menu-hover);
  }
}

.lang-select__item--active {
  background-color: var(--ui-surface);
  color: var(--ui-text-strong);
  font-weight: 600;
}

.lang-select__badge {
  font-size: 0.6875rem;
  padding: 0.1rem 0.35rem;
  border-radius: 0.375rem;
  background-color: var(--ui-line);
  color: var(--ui-accent);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

/* 顶部动作按钮 */
.pg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.85rem;
  font-size: 0.8125rem;
  border-radius: 0.75rem;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.pg-btn--run {
  color: var(--ui-text-strong);
  font-weight: 600;
}

.pg-btn--icon {
  padding: 0 0.6rem;
}

/* 统一单色 SVG mask 图标 */
.icon {
  display: inline-block;
  flex-shrink: 0;
  width: 1rem;
  height: 1rem;
  background-color: currentColor;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
  -webkit-mask-size: contain;
  mask-size: contain;
}

/* 主体左右分栏 */
.pg-body {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  flex: 1;
  min-height: 0;
}

.pg-editor-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background-color: var(--ui-code-bg);
  border-right: 1px solid var(--ui-line);
}

/* Web 模式左侧上方的 HTML / CSS / JS Tab 栏 */
.pg-web-tabs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.35rem 0.65rem 0;
  background-color: var(--ui-surface);
  border-bottom: 1px solid var(--ui-line);
  flex-shrink: 0;
}

.pg-web-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem 0.5rem 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: var(--ui-text-muted);
  background-color: transparent;
  cursor: pointer;
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: var(--ui-text-strong);
    background-color: var(--ui-canvas);
  }
}

.pg-web-tab--active {
  color: var(--ui-text-strong);
  font-weight: 600;
  background-color: var(--ui-code-bg);
  border-color: var(--ui-line);
  margin-bottom: -1px;
  padding-bottom: calc(0.4rem + 1px);
}

.pg-web-tab__ext {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
  background-color: var(--ui-canvas);
  color: var(--ui-accent);
}

.pg-web-tab__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 999px;
  background-color: var(--ui-accent);
  opacity: 0.75;
}

.pg-editor-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.pg-editor-host {
  width: 100%;
  height: 100%;
}

.pg-editor-loading {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: inherit;
}

/* 右侧预览与控制台输出区 */
.pg-output-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background-color: var(--ui-surface);
}

.pg-output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  border-bottom: 1px solid var(--ui-line);
  flex-shrink: 0;
}

.pg-output-header__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pg-output-header__right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.pg-output-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--ui-text-muted);
}

.pg-duration {
  font-size: 0.75rem;
  padding: 0.05rem 0.4rem;
  border-radius: 0.375rem;
  background-color: var(--ui-canvas);
  color: var(--ui-accent);
  font-variant-numeric: tabular-nums;
}

/* Web 预览 iframe 容器 */
.pg-preview-stage {
  position: relative;
  flex: 1;
  min-height: 0;
  background-color: #ffffff;
}

.pg-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background-color: #ffffff;
}

.pg-console-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.22rem 0.55rem;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-line);
  background-color: var(--ui-canvas);
  color: var(--ui-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background-color 0.15s;

  &:hover,
  &--active {
    color: var(--ui-text-strong);
    border-color: var(--ui-accent);
  }
}

.pg-console-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.1rem;
  height: 1.1rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  background-color: var(--ui-surface);
  color: var(--ui-accent);

  &--error {
    background-color: rgb(229 72 77 / 0.16);
    color: var(--ui-wrong);
  }
}

/* Web 模式底部可折叠 Console 抽屉 */
.pg-web-console {
  display: flex;
  flex-direction: column;
  height: 36%;
  min-height: 130px;
  max-height: 240px;
  border-top: 1px solid var(--ui-line);
  background-color: var(--ui-surface);
}

.pg-web-console__header {
  padding: 0.35rem 0.875rem;
}

.pg-web-console__body {
  padding: 0.5rem 0.875rem;
}

.pg-clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  cursor: pointer;
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: var(--ui-text-strong);
    background-color: var(--ui-canvas);
  }
}

.pg-output-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0.875rem;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
  font-size: 0.8125rem;
  line-height: 1.55;
}

.pg-output-empty {
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
  font-style: italic;
}

.pg-log-item {
  padding: 0.35rem 0.5rem;
  border-bottom: 1px dashed var(--ui-line);

  &:last-child {
    border-bottom: none;
  }
}

.pg-log-item--warn {
  color: var(--ui-accent);
}

.pg-log-item--error {
  color: var(--ui-wrong);
  background-color: rgb(229 72 77 / 0.08);
  border-radius: 0.375rem;
  border-bottom: none;
  margin-top: 0.25rem;
}

.pg-log-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

/* 响应式：窄屏改为上下分栏，按钮收起文字只留 SVG 图标 */
@media (width < 768px) {
  .pg-body {
    grid-template-columns: 1fr;
    grid-template-rows: 1.15fr 0.85fr;
  }

  .pg-editor-pane {
    border-right: none;
    border-bottom: 1px solid var(--ui-line);
  }

  .pg-btn__label,
  .pg-clear-btn__label,
  .pg-filename {
    display: none;
  }
}

.td-enter-active,
.td-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.td-enter-from,
.td-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
