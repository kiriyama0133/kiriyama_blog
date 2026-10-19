type MonacoModule = typeof import('monaco-editor')

interface MemberDoc {
  label: string
  kind: 'method' | 'property' | 'field' | 'class' | 'keyword' | 'snippet'
  detail: string
  documentation?: string
  insertText: string
  isSnippet?: boolean
}

const STATIC_TYPE_MEMBERS: Record<string, MemberDoc[]> = {
  Console: [
    {
      label: 'WriteLine',
      kind: 'method',
      detail: 'void Console.WriteLine(object? value)',
      documentation:
        'Writes the text representation of the specified value, followed by the current line terminator, to the standard output stream.',
      insertText: 'WriteLine(${1:value});',
      isSnippet: true
    },
    {
      label: 'Write',
      kind: 'method',
      detail: 'void Console.Write(object? value)',
      documentation:
        'Writes the text representation of the specified value to the standard output stream.',
      insertText: 'Write(${1:value});',
      isSnippet: true
    },
    {
      label: 'ReadLine',
      kind: 'method',
      detail: 'string? Console.ReadLine()',
      documentation: 'Reads the next line of characters from the standard input stream.',
      insertText: 'ReadLine()'
    },
    {
      label: 'Clear',
      kind: 'method',
      detail: 'void Console.Clear()',
      insertText: 'Clear();'
    }
  ],
  Thread: [
    {
      label: 'Sleep',
      kind: 'method',
      detail: 'void Thread.Sleep(int millisecondsTimeout)',
      documentation: 'Suspends the current thread for the specified number of milliseconds.',
      insertText: 'Sleep(${1:100});',
      isSnippet: true
    },
    {
      label: 'CurrentThread',
      kind: 'property',
      detail: 'Thread Thread.CurrentThread { get; }',
      documentation: 'Gets the currently running thread.',
      insertText: 'CurrentThread'
    },
    {
      label: 'Yield',
      kind: 'method',
      detail: 'bool Thread.Yield()',
      insertText: 'Yield()'
    }
  ],
  Task: [
    {
      label: 'Run',
      kind: 'method',
      detail: 'Task Task.Run(Action action)',
      documentation:
        'Queues the specified work to run on the ThreadPool and returns a Task handle for that work.',
      insertText: 'Run(() => {\n\t${1}\n})',
      isSnippet: true
    },
    {
      label: 'Delay',
      kind: 'method',
      detail: 'Task Task.Delay(int millisecondsDelay)',
      documentation: 'Creates a task that completes after a time delay.',
      insertText: 'Delay(${1:100})',
      isSnippet: true
    },
    {
      label: 'WhenAll',
      kind: 'method',
      detail: 'Task Task.WhenAll(params Task[] tasks)',
      documentation:
        'Creates a task that will complete when all of the supplied tasks have completed.',
      insertText: 'WhenAll(${1:tasks})',
      isSnippet: true
    },
    {
      label: 'WhenAny',
      kind: 'method',
      detail: 'Task<Task> Task.WhenAny(params Task[] tasks)',
      insertText: 'WhenAny(${1:tasks})',
      isSnippet: true
    },
    {
      label: 'FromResult',
      kind: 'method',
      detail: 'Task<TResult> Task.FromResult<TResult>(TResult result)',
      insertText: 'FromResult(${1:result})',
      isSnippet: true
    },
    {
      label: 'CompletedTask',
      kind: 'property',
      detail: 'Task Task.CompletedTask { get; }',
      insertText: 'CompletedTask'
    }
  ],
  Enumerable: [
    {
      label: 'Range',
      kind: 'method',
      detail: 'IEnumerable<int> Enumerable.Range(int start, int count)',
      documentation: 'Generates a sequence of integral numbers within a specified range.',
      insertText: 'Range(${1:1}, ${2:10})',
      isSnippet: true
    },
    {
      label: 'Repeat',
      kind: 'method',
      detail: 'IEnumerable<TResult> Enumerable.Repeat<TResult>(TResult element, int count)',
      insertText: 'Repeat(${1:element}, ${2:5})',
      isSnippet: true
    },
    {
      label: 'Empty',
      kind: 'method',
      detail: 'IEnumerable<TResult> Enumerable.Empty<TResult>()',
      insertText: 'Empty<${1:int}>()',
      isSnippet: true
    }
  ],
  string: [
    {
      label: 'Join',
      kind: 'method',
      detail: 'string string.Join<T>(string? separator, IEnumerable<T> values)',
      documentation:
        'Concatenates the members of a collection, using the specified separator between each member.',
      insertText: 'Join(${1:", "}, ${2:values})',
      isSnippet: true
    },
    {
      label: 'Format',
      kind: 'method',
      detail: 'string string.Format(string format, params object?[] args)',
      insertText: 'Format(${1:"{0}"}, ${2:arg})',
      isSnippet: true
    },
    {
      label: 'IsNullOrEmpty',
      kind: 'method',
      detail: 'bool string.IsNullOrEmpty(string? value)',
      insertText: 'IsNullOrEmpty(${1:str})',
      isSnippet: true
    },
    {
      label: 'IsNullOrWhiteSpace',
      kind: 'method',
      detail: 'bool string.IsNullOrWhiteSpace(string? value)',
      insertText: 'IsNullOrWhiteSpace(${1:str})',
      isSnippet: true
    },
    {
      label: 'Empty',
      kind: 'field',
      detail: 'readonly string string.Empty = ""',
      insertText: 'Empty'
    }
  ],
  Math: [
    {
      label: 'Max',
      kind: 'method',
      detail: 'int Math.Max(int val1, int val2)',
      insertText: 'Max(${1:a}, ${2:b})',
      isSnippet: true
    },
    {
      label: 'Min',
      kind: 'method',
      detail: 'int Math.Min(int val1, int val2)',
      insertText: 'Min(${1:a}, ${2:b})',
      isSnippet: true
    },
    {
      label: 'Abs',
      kind: 'method',
      detail: 'int Math.Abs(int value)',
      insertText: 'Abs(${1:value})',
      isSnippet: true
    },
    {
      label: 'Pow',
      kind: 'method',
      detail: 'double Math.Pow(double x, double y)',
      insertText: 'Pow(${1:x}, ${2:y})',
      isSnippet: true
    },
    {
      label: 'Sqrt',
      kind: 'method',
      detail: 'double Math.Sqrt(double d)',
      insertText: 'Sqrt(${1:d})',
      isSnippet: true
    },
    {
      label: 'Round',
      kind: 'method',
      detail: 'double Math.Round(double a)',
      insertText: 'Round(${1:a})',
      isSnippet: true
    },
    {
      label: 'PI',
      kind: 'field',
      detail: 'const double Math.PI = 3.1415926535897931',
      insertText: 'PI'
    }
  ],
  DateTime: [
    { label: 'Now', kind: 'property', detail: 'DateTime DateTime.Now { get; }', insertText: 'Now' },
    {
      label: 'UtcNow',
      kind: 'property',
      detail: 'DateTime DateTime.UtcNow { get; }',
      insertText: 'UtcNow'
    },
    {
      label: 'Today',
      kind: 'property',
      detail: 'DateTime DateTime.Today { get; }',
      insertText: 'Today'
    },
    {
      label: 'Parse',
      kind: 'method',
      detail: 'DateTime DateTime.Parse(string s)',
      insertText: 'Parse(${1:str})',
      isSnippet: true
    }
  ],
  Guid: [
    { label: 'NewGuid', kind: 'method', detail: 'Guid Guid.NewGuid()', insertText: 'NewGuid()' },
    { label: 'Empty', kind: 'field', detail: 'readonly Guid Guid.Empty', insertText: 'Empty' }
  ]
}
STATIC_TYPE_MEMBERS.String = STATIC_TYPE_MEMBERS.string!

const INSTANCE_MEMBERS_BY_TYPE: Record<string, MemberDoc[]> = {
  Thread: [
    {
      label: 'Start',
      kind: 'method',
      detail: 'void Thread.Start(object? parameter)',
      documentation:
        'Causes the operating system to change the state of the current instance to ThreadState.Running.',
      insertText: 'Start(${1});',
      isSnippet: true
    },
    {
      label: 'Join',
      kind: 'method',
      detail: 'void Thread.Join()',
      documentation:
        'Blocks the calling thread until the thread represented by this instance terminates.',
      insertText: 'Join();'
    },
    {
      label: 'IsAlive',
      kind: 'property',
      detail: 'bool Thread.IsAlive { get; }',
      insertText: 'IsAlive'
    },
    {
      label: 'IsBackground',
      kind: 'property',
      detail: 'bool Thread.IsBackground { get; set; }',
      insertText: 'IsBackground'
    },
    {
      label: 'ManagedThreadId',
      kind: 'property',
      detail: 'int Thread.ManagedThreadId { get; }',
      insertText: 'ManagedThreadId'
    },
    {
      label: 'Name',
      kind: 'property',
      detail: 'string? Thread.Name { get; set; }',
      insertText: 'Name'
    }
  ],
  string: [
    {
      label: 'Length',
      kind: 'property',
      detail: 'int string.Length { get; }',
      insertText: 'Length'
    },
    {
      label: 'Substring',
      kind: 'method',
      detail: 'string string.Substring(int startIndex, int length)',
      insertText: 'Substring(${1:0}, ${2:len})',
      isSnippet: true
    },
    {
      label: 'Split',
      kind: 'method',
      detail: 'string[] string.Split(char separator)',
      insertText: "Split(${1:','})",
      isSnippet: true
    },
    {
      label: 'Replace',
      kind: 'method',
      detail: 'string string.Replace(string oldValue, string newValue)',
      insertText: 'Replace(${1:oldVal}, ${2:newVal})',
      isSnippet: true
    },
    {
      label: 'Contains',
      kind: 'method',
      detail: 'bool string.Contains(string value)',
      insertText: 'Contains(${1:value})',
      isSnippet: true
    },
    {
      label: 'StartsWith',
      kind: 'method',
      detail: 'bool string.StartsWith(string value)',
      insertText: 'StartsWith(${1:value})',
      isSnippet: true
    },
    {
      label: 'EndsWith',
      kind: 'method',
      detail: 'bool string.EndsWith(string value)',
      insertText: 'EndsWith(${1:value})',
      isSnippet: true
    },
    { label: 'Trim', kind: 'method', detail: 'string string.Trim()', insertText: 'Trim()' },
    {
      label: 'ToLower',
      kind: 'method',
      detail: 'string string.ToLower()',
      insertText: 'ToLower()'
    },
    { label: 'ToUpper', kind: 'method', detail: 'string string.ToUpper()', insertText: 'ToUpper()' }
  ]
}

const COMMON_DOT_MEMBERS: MemberDoc[] = [
  // LINQ & 集合通用方法
  {
    label: 'Select',
    kind: 'method',
    detail:
      'IEnumerable<TResult> Enumerable.Select<TSource, TResult>(Func<TSource, TResult> selector)',
    documentation: 'Projects each element of a sequence into a new form.',
    insertText: 'Select(${1:x} => ${2:x})',
    isSnippet: true
  },
  {
    label: 'Where',
    kind: 'method',
    detail: 'IEnumerable<TSource> Enumerable.Where<TSource>(Func<TSource, bool> predicate)',
    documentation: 'Filters a sequence of values based on a predicate.',
    insertText: 'Where(${1:x} => ${2:true})',
    isSnippet: true
  },
  {
    label: 'ToList',
    kind: 'method',
    detail: 'List<TSource> Enumerable.ToList<TSource>()',
    insertText: 'ToList()'
  },
  {
    label: 'ToArray',
    kind: 'method',
    detail: 'TSource[] Enumerable.ToArray<TSource>()',
    insertText: 'ToArray()'
  },
  {
    label: 'FirstOrDefault',
    kind: 'method',
    detail: 'TSource? Enumerable.FirstOrDefault<TSource>()',
    insertText: 'FirstOrDefault()'
  },
  {
    label: 'Any',
    kind: 'method',
    detail: 'bool Enumerable.Any<TSource>(Func<TSource, bool> predicate)',
    insertText: 'Any(${1:x} => ${2:true})',
    isSnippet: true
  },
  {
    label: 'Count',
    kind: 'method',
    detail: 'int Enumerable.Count<TSource>()',
    insertText: 'Count()'
  },
  {
    label: 'Sum',
    kind: 'method',
    detail: 'int Enumerable.Sum(IEnumerable<int> source)',
    insertText: 'Sum()'
  },
  {
    label: 'OrderBy',
    kind: 'method',
    detail:
      'IOrderedEnumerable<TSource> Enumerable.OrderBy<TSource, TKey>(Func<TSource, TKey> keySelector)',
    insertText: 'OrderBy(${1:x} => ${2:x})',
    isSnippet: true
  },
  {
    label: 'OrderByDescending',
    kind: 'method',
    detail:
      'IOrderedEnumerable<TSource> Enumerable.OrderByDescending<TSource, TKey>(Func<TSource, TKey> keySelector)',
    insertText: 'OrderByDescending(${1:x} => ${2:x})',
    isSnippet: true
  },
  {
    label: 'GroupBy',
    kind: 'method',
    detail:
      'IEnumerable<IGrouping<TKey, TSource>> Enumerable.GroupBy<TSource, TKey>(Func<TSource, TKey> keySelector)',
    insertText: 'GroupBy(${1:x} => ${2:x})',
    isSnippet: true
  },
  {
    label: 'Add',
    kind: 'method',
    detail: 'void List<T>.Add(T item)',
    insertText: 'Add(${1:item});',
    isSnippet: true
  },
  {
    label: 'ToString',
    kind: 'method',
    detail: 'string object.ToString()',
    insertText: 'ToString()'
  },
  {
    label: 'GetType',
    kind: 'method',
    detail: 'Type object.GetType()',
    insertText: 'GetType()'
  }
]

const GLOBAL_COMPLETIONS: MemberDoc[] = [
  // 快捷代码片段
  {
    label: 'cw',
    kind: 'snippet',
    detail: 'Console.WriteLine(...)',
    insertText: 'Console.WriteLine(${1:value});',
    isSnippet: true
  },
  {
    label: 'for',
    kind: 'snippet',
    detail: 'for loop',
    insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++)\n{\n\t${3}\n}',
    isSnippet: true
  },
  {
    label: 'foreach',
    kind: 'snippet',
    detail: 'foreach loop',
    insertText: 'foreach (var ${1:item} in ${2:collection})\n{\n\t${3}\n}',
    isSnippet: true
  },
  {
    label: 'try',
    kind: 'snippet',
    detail: 'try-catch block',
    insertText:
      'try\n{\n\t${1}\n}\ncatch (Exception ${2:ex})\n{\n\tConsole.WriteLine(${2:ex}.Message);\n}',
    isSnippet: true
  },
  // 核心类型
  { label: 'Console', kind: 'class', detail: 'class System.Console', insertText: 'Console' },
  {
    label: 'Enumerable',
    kind: 'class',
    detail: 'class System.Linq.Enumerable',
    insertText: 'Enumerable'
  },
  { label: 'Thread', kind: 'class', detail: 'class System.Threading.Thread', insertText: 'Thread' },
  {
    label: 'ThreadStart',
    kind: 'class',
    detail: 'delegate void System.Threading.ThreadStart()',
    insertText: 'ThreadStart'
  },
  {
    label: 'ParameterizedThreadStart',
    kind: 'class',
    detail: 'delegate void System.Threading.ParameterizedThreadStart(object? obj)',
    insertText: 'ParameterizedThreadStart'
  },
  { label: 'Task', kind: 'class', detail: 'class System.Threading.Tasks.Task', insertText: 'Task' },
  { label: 'Math', kind: 'class', detail: 'class System.Math', insertText: 'Math' },
  { label: 'DateTime', kind: 'class', detail: 'struct System.DateTime', insertText: 'DateTime' },
  { label: 'TimeSpan', kind: 'class', detail: 'struct System.TimeSpan', insertText: 'TimeSpan' },
  { label: 'Guid', kind: 'class', detail: 'struct System.Guid', insertText: 'Guid' },
  {
    label: 'StringBuilder',
    kind: 'class',
    detail: 'class System.Text.StringBuilder',
    insertText: 'StringBuilder'
  },
  {
    label: 'List',
    kind: 'class',
    detail: 'class System.Collections.Generic.List<T>',
    insertText: 'List<${1:int}>',
    isSnippet: true
  },
  {
    label: 'Dictionary',
    kind: 'class',
    detail: 'class System.Collections.Generic.Dictionary<TKey, TValue>',
    insertText: 'Dictionary<${1:string}, ${2:int}>',
    isSnippet: true
  },
  {
    label: 'HashSet',
    kind: 'class',
    detail: 'class System.Collections.Generic.HashSet<T>',
    insertText: 'HashSet<${1:int}>',
    isSnippet: true
  },
  {
    label: 'Action',
    kind: 'class',
    detail: 'delegate void System.Action<T>(T obj)',
    insertText: 'Action'
  },
  {
    label: 'Func',
    kind: 'class',
    detail: 'delegate TResult System.Func<T, TResult>(T arg)',
    insertText: 'Func'
  },
  { label: 'Exception', kind: 'class', detail: 'class System.Exception', insertText: 'Exception' },
  // 常用关键字
  ...[
    'public',
    'private',
    'protected',
    'internal',
    'static',
    'readonly',
    'const',
    'async',
    'await',
    'var',
    'new',
    'class',
    'struct',
    'record',
    'interface',
    'enum',
    'delegate',
    'void',
    'int',
    'long',
    'double',
    'float',
    'decimal',
    'bool',
    'string',
    'object',
    'return',
    'if',
    'else',
    'switch',
    'case',
    'while',
    'do',
    'break',
    'continue',
    'using',
    'namespace',
    'null',
    'true',
    'false'
  ].map((kw): MemberDoc => ({
    label: kw,
    kind: 'keyword',
    detail: `C# keyword '${kw}'`,
    insertText: kw
  }))
]

/**
 * 从当前编辑器源码中轻量推断局部变量与方法名，提供上下文补全
 */
function inferLocalSymbols(source: string): {
  varTypes: Record<string, string>
  symbols: MemberDoc[]
} {
  const varTypes: Record<string, string> = {}
  const symbols: MemberDoc[] = []
  const seen = new Set<string>()

  // 匹配显式类型声明：Thread thread = ... 或 List<int> items = ...
  const explicitVarRe =
    /\b(Thread|Task|string|String|int|double|bool|DateTime|StringBuilder|List\s*<[^>]+>|Dictionary\s*<[^>]+>)\s+([A-Za-z_]\w*)\s*[=;)]/g
  for (const match of source.matchAll(explicitVarRe)) {
    const rawType = match[1]!.replace(/\s+/g, '')
    const varName = match[2]!
    const baseType = rawType.startsWith('List<')
      ? 'List'
      : rawType.startsWith('Dictionary<')
        ? 'Dictionary'
        : rawType === 'String'
          ? 'string'
          : rawType
    varTypes[varName] = baseType
    if (!seen.has(varName)) {
      seen.add(varName)
      symbols.push({
        label: varName,
        kind: 'field',
        detail: `${rawType} ${varName}`,
        insertText: varName
      })
    }
  }

  // 匹配 var 声明：var x = new Thread(...) / var s = "..."
  const varDeclRe = /\bvar\s+([A-Za-z_]\w*)\s*=\s*([^\n;]+)/g
  for (const match of source.matchAll(varDeclRe)) {
    const varName = match[1]!
    const rhs = match[2]!.trim()
    let inferred = 'var'
    const newMatch = rhs.match(/^new\s+([A-Za-z_]\w*)/)
    if (newMatch) {
      inferred = newMatch[1]!
      varTypes[varName] = inferred
    } else if (rhs.startsWith('"') || rhs.startsWith('$"') || rhs.startsWith('string.')) {
      inferred = 'string'
      varTypes[varName] = 'string'
    }
    if (!seen.has(varName)) {
      seen.add(varName)
      symbols.push({
        label: varName,
        kind: 'field',
        detail: `${inferred} ${varName}`,
        insertText: varName
      })
    }
  }

  // 匹配本地方法定义：void ThreadMethod2(...)
  const methodRe = /\b(?:void|Task|int|string|bool|double|object)\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/g
  for (const match of source.matchAll(methodRe)) {
    const methodName = match[1]!
    const params = match[2]!.trim()
    if (methodName !== 'Main' && !seen.has(methodName)) {
      seen.add(methodName)
      symbols.push({
        label: methodName,
        kind: 'method',
        detail: `${methodName}(${params})`,
        insertText: methodName
      })
    }
  }

  return { varTypes, symbols }
}

export function registerCSharpIntelliSense(monaco: MonacoModule) {
  const Kind = monaco.languages.CompletionItemKind
  const InsertRule = monaco.languages.CompletionItemInsertTextRule

  const toMonacoKind = (k: MemberDoc['kind']) => {
    switch (k) {
      case 'method':
        return Kind.Method
      case 'property':
        return Kind.Property
      case 'field':
        return Kind.Variable
      case 'class':
        return Kind.Class
      case 'snippet':
        return Kind.Snippet
      default:
        return Kind.Keyword
    }
  }

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
      const fullSource = model.getValue()
      const { varTypes, symbols } = inferLocalSymbols(fullSource)

      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)

      // 检查是否是 xxx. 触发的成员补全
      const dotMatch = linePrefix.match(/([A-Za-z_]\w*)\.\w*$/)
      if (dotMatch) {
        const receiver = dotMatch[1]!
        // 1. 静态类成员（如 Console. / Thread. / Task. / Enumerable. / string. / Math.）
        if (STATIC_TYPE_MEMBERS[receiver]) {
          return {
            suggestions: STATIC_TYPE_MEMBERS[receiver]!.map((m) => ({
              label: m.label,
              kind: toMonacoKind(m.kind),
              detail: m.detail,
              documentation: m.documentation,
              insertText: m.insertText,
              insertTextRules: m.isSnippet ? InsertRule.InsertAsSnippet : undefined,
              range
            }))
          }
        }

        // 2. 已知类型的局部变量实例成员（如 thread.Start() / str.Substring()）
        const inferredType = varTypes[receiver]
        const typeMembers = inferredType ? (INSTANCE_MEMBERS_BY_TYPE[inferredType] ?? []) : []
        const combined = [...typeMembers, ...COMMON_DOT_MEMBERS]
        return {
          suggestions: combined.map((m) => ({
            label: m.label,
            kind: toMonacoKind(m.kind),
            detail: m.detail,
            documentation: m.documentation,
            insertText: m.insertText,
            insertTextRules: m.isSnippet ? InsertRule.InsertAsSnippet : undefined,
            range
          }))
        }
      }

      // 全局上下文：当前文件内声明的变量/方法 + 全局类/关键字/代码片段
      const allGlobal = [...symbols, ...GLOBAL_COMPLETIONS]
      return {
        suggestions: allGlobal.map((m) => ({
          label: m.label,
          kind: toMonacoKind(m.kind),
          detail: m.detail,
          documentation: m.documentation,
          insertText: m.insertText,
          insertTextRules: m.isSnippet ? InsertRule.InsertAsSnippet : undefined,
          range
        }))
      }
    }
  })

  // 注册悬停签名提示（Hover Provider）
  const hoverDict = new Map<string, MemberDoc>()
  for (const list of Object.values(STATIC_TYPE_MEMBERS)) {
    for (const item of list) hoverDict.set(item.label, item)
  }
  for (const list of Object.values(INSTANCE_MEMBERS_BY_TYPE)) {
    for (const item of list) hoverDict.set(item.label, item)
  }
  for (const item of [...COMMON_DOT_MEMBERS, ...GLOBAL_COMPLETIONS]) {
    if (item.kind !== 'keyword') hoverDict.set(item.label, item)
  }

  monaco.languages.registerHoverProvider('csharp', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position)
      if (!word) return null
      const doc = hoverDict.get(word.word)
      if (!doc) return null
      const contents = [{ value: '```csharp\n' + doc.detail + '\n```' }]
      if (doc.documentation) {
        contents.push({ value: doc.documentation })
      }
      return {
        range: new monaco.Range(
          position.lineNumber,
          word.startColumn,
          position.lineNumber,
          word.endColumn
        ),
        contents
      }
    }
  })
}
