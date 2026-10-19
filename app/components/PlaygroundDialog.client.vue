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

      <!-- 主体分栏：左侧 Monaco IDE 区域，右侧运行输出区域 -->
      <div class="pg-body">
        <section class="pg-editor-pane" :aria-label="t('playground.editorAria')">
          <div v-if="editorLoading" class="pg-editor-loading">
            <SpinCircle />
          </div>
          <div ref="editorContainerRef" class="pg-editor-host" />
        </section>

        <section class="pg-output-pane" :aria-label="t('playground.outputAria')">
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
        </section>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { PlaygroundLanguage } from '~/composables/usePlayground'
import { usePlayground } from '~/composables/usePlayground'
import { useTheme } from '~/composables/useTheme'
import type { ConsoleEntry } from '~/utils/code-runner'
import { runPlaygroundCode } from '~/utils/code-runner'

import playIcon from '~/assets/image/play-svgrepo-com.svg'
import restartIcon from '~/assets/image/restart-svgrepo-com.svg'
import closeIcon from '~/assets/image/close-circle-svgrepo-com.svg'
import trashIcon from '~/assets/image/trash-bin-trash-svgrepo-com.svg'
import codeIcon from '~/assets/image/code-square-svgrepo-com.svg'

const { t } = useI18n()
const { isDark } = useTheme()
const { isOpen, code, language, filename, resetCode, closePlayground } = usePlayground()

const langDropdownRef = ref<HTMLElement | null>(null)
const langMenuOpen = ref(false)
onClickOutside(langDropdownRef, () => {
  langMenuOpen.value = false
})

const languageOptions: Array<{ value: PlaygroundLanguage; label: string; badge?: string }> = [
  { value: 'typescript', label: 'TypeScript', badge: 'TS' },
  { value: 'javascript', label: 'JavaScript', badge: 'JS' },
  { value: 'csharp', label: 'C# (.NET)', badge: 'WASM' }
]

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

function clearOutput() {
  logs.value = []
  errorMsg.value = ''
  lastDurationMs.value = null
}

// Monaco Editor 按需加载与实例管理
const editorContainerRef = ref<HTMLElement | null>(null)
const editorLoading = ref(false)

type MonacoModule = typeof import('monaco-editor')
type MonacoEditorInstance = import('monaco-editor').editor.IStandaloneCodeEditor

let monacoMod: MonacoModule | null = null
const editorInstance = shallowRef<MonacoEditorInstance | null>(null)
let themesDefined = false

async function ensureMonacoLoaded(): Promise<MonacoModule> {
  if (monacoMod) return monacoMod

  editorLoading.value = true
  try {
    // monaco-editor 0.57+ 已在内部通过 new Worker(new URL(..., import.meta.url)) 原生支持 Vite ESM Worker
    const monaco = await import('monaco-editor')

    if (!themesDefined) {
      // 与 main.scss 的 $color-light-code-bg (#f6f8fa) / $color-dark-code-bg (#1f1f29) 完全对齐
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

      // 配置 TypeScript 语言服务以开启完整的类型推断与自动补全（兼容 0.57+ 的 monaco.typescript）
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

      // 为 C# 注册常用 BCL / LINQ / 语法片段的智能补全
      monaco.languages.registerCompletionItemProvider('csharp', {
        triggerCharacters: ['.'],
        provideCompletionItems(model, position) {
          const word = model.getWordUntilPosition(position)
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          }
          const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)

          const Kind = monaco.languages.CompletionItemKind
          const InsertRule = monaco.languages.CompletionItemInsertTextRule

          if (/\bConsole\.\w*$/.test(linePrefix)) {
            return {
              suggestions: [
                {
                  label: 'WriteLine',
                  kind: Kind.Method,
                  detail: 'void Console.WriteLine(object? value)',
                  documentation:
                    'Writes the text representation of the specified value, followed by the current line terminator, to the standard output stream.',
                  insertText: 'WriteLine(${1:value});',
                  insertTextRules: InsertRule.InsertAsSnippet,
                  range
                },
                {
                  label: 'Write',
                  kind: Kind.Method,
                  detail: 'void Console.Write(object? value)',
                  insertText: 'Write(${1:value});',
                  insertTextRules: InsertRule.InsertAsSnippet,
                  range
                },
                {
                  label: 'ReadLine',
                  kind: Kind.Method,
                  detail: 'string? Console.ReadLine()',
                  insertText: 'ReadLine()',
                  range
                }
              ]
            }
          }

          return {
            suggestions: [
              {
                label: 'cw',
                kind: Kind.Snippet,
                detail: 'Console.WriteLine(...)',
                insertText: 'Console.WriteLine(${1:value});',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'Console.WriteLine',
                kind: Kind.Method,
                detail: 'void Console.WriteLine(object? value)',
                insertText: 'Console.WriteLine(${1:value});',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'Select',
                kind: Kind.Method,
                detail:
                  'IEnumerable<TResult> Enumerable.Select<TSource, TResult>(Func<TSource, TResult> selector)',
                insertText: 'Select(${1:x} => ${2:x})',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'Where',
                kind: Kind.Method,
                detail:
                  'IEnumerable<TSource> Enumerable.Where<TSource>(Func<TSource, bool> predicate)',
                insertText: 'Where(${1:x} => ${2:true})',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'ToList',
                kind: Kind.Method,
                detail: 'List<TSource> Enumerable.ToList<TSource>()',
                insertText: 'ToList()',
                range
              },
              {
                label: 'FirstOrDefault',
                kind: Kind.Method,
                detail: 'TSource? Enumerable.FirstOrDefault<TSource>()',
                insertText: 'FirstOrDefault()',
                range
              },
              {
                label: 'OrderBy',
                kind: Kind.Method,
                detail:
                  'IOrderedEnumerable<TSource> Enumerable.OrderBy<TSource, TKey>(Func<TSource, TKey> keySelector)',
                insertText: 'OrderBy(${1:x} => ${2:x})',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'List',
                kind: Kind.Class,
                detail: 'System.Collections.Generic.List<T>',
                insertText: 'List<${1:int}>',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              },
              {
                label: 'Dictionary',
                kind: Kind.Class,
                detail: 'System.Collections.Generic.Dictionary<TKey, TValue>',
                insertText: 'Dictionary<${1:string}, ${2:int}>',
                insertTextRules: InsertRule.InsertAsSnippet,
                range
              }
            ]
          }
        }
      })

      themesDefined = true
    }

    monacoMod = monaco
    return monaco
  } finally {
    editorLoading.value = false
  }
}

const DEFAULT_LANGUAGE_SNIPPETS: Record<PlaygroundLanguage, string> = {
  typescript: [
    'const nums: number[] = [1, 2, 3, 4, 5]',
    'console.log("Squares:", nums.map(n => n * n))'
  ].join('\n'),
  javascript: [
    'const nums = [1, 2, 3, 4, 5]',
    'console.log("Squares:", nums.map(n => n * n))'
  ].join('\n'),
  csharp: [
    'var nums = Enumerable.Range(1, 5).Select(x => x * x);',
    'Console.WriteLine("Hello from .NET WASM! " + string.Join(", ", nums));'
  ].join('\n')
}

// 为每种语言维护独立的代码缓存，切换语言时互不污染（避免把文章里的 JS/TS 代码直接带进 C# 编译器或残留 TS 报错）
const langCodeMap = ref<Record<PlaygroundLanguage, string>>({
  typescript: DEFAULT_LANGUAGE_SNIPPETS.typescript,
  javascript: DEFAULT_LANGUAGE_SNIPPETS.javascript,
  csharp: DEFAULT_LANGUAGE_SNIPPETS.csharp
})
const originLanguage = ref<PlaygroundLanguage>('typescript')

function createFreshModel(monaco: MonacoModule, value: string, lang: PlaygroundLanguage) {
  const ext = lang === 'csharp' ? 'cs' : lang === 'typescript' ? 'ts' : 'js'
  const uri = monaco.Uri.parse(`inmemory://playground/snippet-${++modelSeq}.${ext}`)
  return monaco.editor.createModel(value, lang, uri)
}

let modelSeq = 0

async function mountOrSyncEditor() {
  if (!isOpen.value) return
  await nextTick()
  const container = editorContainerRef.value
  if (!container) return

  const monaco = await ensureMonacoLoaded()
  // 如果弹窗在等待加载期间被关闭，直接中止
  if (!isOpen.value || !editorContainerRef.value) return

  if (!editorInstance.value) {
    const initialModel = createFreshModel(monaco, code.value, language.value)
    const editor = monaco.editor.create(editorContainerRef.value, {
      model: initialModel,
      theme: isDark.value ? 'kiriyama-dark' : 'kiriyama-light',
      automaticLayout: true,
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
      const val = editor.getValue()
      if (val !== code.value) {
        code.value = val
      }
      langCodeMap.value[language.value] = val
      // 修改代码时清除上一次 C# 编译留下的错误波浪线
      const model = editor.getModel()
      if (monacoMod && model && language.value === 'csharp') {
        monacoMod.editor.setModelMarkers(model, 'csharp', [])
      }
    })

    // 快捷键 Ctrl+Enter / Cmd+Enter 直接运行
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRun()
    })

    editorInstance.value = editor
  } else {
    const oldModel = editorInstance.value.getModel()
    const nextModel = createFreshModel(monaco, code.value, language.value)
    editorInstance.value.setModel(nextModel)
    oldModel?.dispose()
    monaco.editor.setTheme(isDark.value ? 'kiriyama-dark' : 'kiriyama-light')
  }
}

function disposeEditor() {
  if (editorInstance.value) {
    const oldModel = editorInstance.value.getModel()
    editorInstance.value.dispose()
    oldModel?.dispose()
    editorInstance.value = null
  }
}

watch(isOpen, async (open) => {
  if (open) {
    clearOutput()
    originLanguage.value = language.value
    langCodeMap.value = {
      typescript: DEFAULT_LANGUAGE_SNIPPETS.typescript,
      javascript: DEFAULT_LANGUAGE_SNIPPETS.javascript,
      csharp: DEFAULT_LANGUAGE_SNIPPETS.csharp,
      [language.value]: code.value
    }
    await mountOrSyncEditor()
    // 打开 Playground 时如果是 TS/JS，自动执行一次让右侧立刻看到结果
    if (language.value === 'typescript' || language.value === 'javascript') {
      await handleRun()
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
  if (oldLang && editorInstance.value) {
    langCodeMap.value[oldLang] = editorInstance.value.getValue()
  }
  const targetCode = langCodeMap.value[newLang] ?? DEFAULT_LANGUAGE_SNIPPETS[newLang]
  code.value = targetCode
  clearOutput()

  if (monacoMod && editorInstance.value) {
    // 彻底销毁旧语言的 Model 并创建带对应扩展名 (.ts/.js/.cs) 的新 Model，
    // 防止 ts.worker 的异步校验（如 TS1434 / TS2304）残留在 C# 模式下
    const oldModel = editorInstance.value.getModel()
    const nextModel = createFreshModel(monacoMod, targetCode, newLang)
    editorInstance.value.setModel(nextModel)
    oldModel?.dispose()
  }
})

function selectLanguage(lang: PlaygroundLanguage) {
  language.value = lang
  langMenuOpen.value = false
}

function handleReset() {
  if (language.value === originLanguage.value) {
    resetCode()
  } else {
    code.value = DEFAULT_LANGUAGE_SNIPPETS[language.value]
  }
  langCodeMap.value[language.value] = code.value
  if (editorInstance.value && editorInstance.value.getValue() !== code.value) {
    editorInstance.value.setValue(code.value)
  }
  clearOutput()
}

async function handleRun() {
  if (running.value) return
  running.value = true
  clearOutput()
  try {
    const currentCode = editorInstance.value ? editorInstance.value.getValue() : code.value
    const result = await runPlaygroundCode(language.value, currentCode)
    logs.value = result.entries
    errorMsg.value = result.error ?? ''
    lastDurationMs.value = result.durationMs

    // 如果返回了 Roslyn 的行列诊断信息，同步画到左侧 Monaco 编辑器的波浪线上
    if (monacoMod && editorInstance.value && language.value === 'csharp') {
      const model = editorInstance.value.getModel()
      if (model) {
        const markers = (result.diagnostics ?? []).map((d) => {
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
        monacoMod.editor.setModelMarkers(model, 'csharp', markers)
      }
    }
  } finally {
    running.value = false
  }
}

onBeforeUnmount(() => {
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
  width: 11.5rem;
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
  grid-template-columns: 1.2fr 0.8fr;
  flex: 1;
  min-height: 0;
}

.pg-editor-pane {
  position: relative;
  min-width: 0;
  min-height: 0;
  background-color: var(--ui-code-bg);
  border-right: 1px solid var(--ui-line);
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

/* 右侧控制台输出区 */
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
