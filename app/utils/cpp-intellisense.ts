import type * as Monaco from 'monaco-editor'

type MonacoModule = typeof Monaco

interface CppMemberMeta {
  label: string
  kind: 'method' | 'property' | 'class' | 'function' | 'constant'
  detail: string
  documentation: string
  insertText: string
  isSnippet?: boolean
}

const C_CPP_HEADERS: Array<{ header: string; desc: string; cppOnly?: boolean }> = [
  {
    header: 'iostream',
    desc: 'Standard input/output stream objects (std::cout, std::cin)',
    cppOnly: true
  },
  { header: 'vector', desc: 'std::vector dynamic contiguous array container', cppOnly: true },
  {
    header: 'string',
    desc: 'std::string character sequence container and utilities',
    cppOnly: true
  },
  {
    header: 'algorithm',
    desc: 'Standard algorithms (std::sort, std::find, std::max, ...)',
    cppOnly: true
  },
  { header: 'map', desc: 'std::map sorted associative key-value container', cppOnly: true },
  {
    header: 'unordered_map',
    desc: 'std::unordered_map hash table key-value container',
    cppOnly: true
  },
  { header: 'set', desc: 'std::set sorted unique key container', cppOnly: true },
  {
    header: 'unordered_set',
    desc: 'std::unordered_set hash table unique key container',
    cppOnly: true
  },
  { header: 'queue', desc: 'std::queue and std::priority_queue container adaptors', cppOnly: true },
  { header: 'stack', desc: 'std::stack LIFO container adaptor', cppOnly: true },
  { header: 'deque', desc: 'std::deque double-ended queue container', cppOnly: true },
  { header: 'memory', desc: 'Smart pointers (std::unique_ptr, std::shared_ptr)', cppOnly: true },
  { header: 'ranges', desc: 'C++20 Ranges library (std::views, std::ranges)', cppOnly: true },
  {
    header: 'numeric',
    desc: 'Numeric operations (std::accumulate, std::iota, std::gcd)',
    cppOnly: true
  },
  {
    header: 'functional',
    desc: 'std::function, std::bind, standard function objects',
    cppOnly: true
  },
  { header: 'optional', desc: 'std::optional wrapper for nullable values', cppOnly: true },
  { header: 'tuple', desc: 'std::tuple fixed-size heterogeneous collection', cppOnly: true },
  { header: 'utility', desc: 'std::pair, std::move, std::forward, std::swap', cppOnly: true },
  { header: 'sstream', desc: 'std::stringstream string stream classes', cppOnly: true },
  {
    header: 'iomanip',
    desc: 'Input/output manipulators (std::setw, std::setprecision)',
    cppOnly: true
  },
  {
    header: 'cmath',
    desc: 'C++ mathematical functions (std::sqrt, std::pow, std::abs)',
    cppOnly: true
  },
  {
    header: 'cstdio',
    desc: 'C-style input/output functions (std::printf, std::puts)',
    cppOnly: true
  },
  { header: 'cstdlib', desc: 'C standard general utilities', cppOnly: true },
  { header: 'cstring', desc: 'C-style null-terminated string functions', cppOnly: true },
  { header: 'stdio.h', desc: 'Standard C input/output library (printf, scanf, puts, FILE)' },
  { header: 'stdlib.h', desc: 'Standard C library (malloc, free, calloc, atoi, qsort, exit)' },
  { header: 'string.h', desc: 'C string & memory manipulation (strlen, strcmp, memcpy, memset)' },
  { header: 'stdbool.h', desc: 'C boolean type and macros (bool, true, false)' },
  { header: 'stdint.h', desc: 'Exact-width integer types (int32_t, uint64_t, uintptr_t)' },
  { header: 'math.h', desc: 'C mathematical functions (sqrt, pow, sin, cos, fabs)' },
  { header: 'limits.h', desc: 'Sizes of integral types (INT_MAX, INT_MIN, LLONG_MAX)' },
  { header: 'assert.h', desc: 'Diagnostics assertion macro (assert)' },
  { header: 'time.h', desc: 'C time and date utilities (time, clock, struct tm)' }
]

const STD_NAMESPACE_MEMBERS: CppMemberMeta[] = [
  {
    label: 'cout',
    kind: 'property',
    detail: 'std::ostream std::cout',
    documentation: 'Standard output stream associated with stdout.',
    insertText: 'cout << ${1:value} << std::endl;',
    isSnippet: true
  },
  {
    label: 'endl',
    kind: 'property',
    detail: 'std::ostream& std::endl(std::ostream& os)',
    documentation: 'Inserts a newline character into the output sequence and flushes it.',
    insertText: 'endl'
  },
  {
    label: 'cin',
    kind: 'property',
    detail: 'std::istream std::cin',
    documentation: 'Standard input stream associated with stdin.',
    insertText: 'cin >> ${1:var}',
    isSnippet: true
  },
  {
    label: 'cerr',
    kind: 'property',
    detail: 'std::ostream std::cerr',
    documentation: 'Standard error stream associated with stderr.',
    insertText: 'cerr << ${1:err} << std::endl;',
    isSnippet: true
  },
  {
    label: 'vector',
    kind: 'class',
    detail: 'template <class T> class std::vector',
    documentation: 'Sequence container that encapsulates dynamic size arrays.',
    insertText: 'vector<${1:int}>',
    isSnippet: true
  },
  {
    label: 'string',
    kind: 'class',
    detail: 'class std::basic_string<char>',
    documentation: 'Standard string class that stores and manipulates sequences of characters.',
    insertText: 'string'
  },
  {
    label: 'map',
    kind: 'class',
    detail: 'template <class Key, class T> class std::map',
    documentation: 'Sorted associative container that contains key-value pairs with unique keys.',
    insertText: 'map<${1:std::string}, ${2:int}>',
    isSnippet: true
  },
  {
    label: 'unordered_map',
    kind: 'class',
    detail: 'template <class Key, class T> class std::unordered_map',
    documentation:
      'Associative container that contains key-value pairs with unique keys (hash table, O(1) average lookup).',
    insertText: 'unordered_map<${1:std::string}, ${2:int}>',
    isSnippet: true
  },
  {
    label: 'set',
    kind: 'class',
    detail: 'template <class Key> class std::set',
    documentation:
      'Associative container that contains a sorted set of unique objects of type Key.',
    insertText: 'set<${1:int}>',
    isSnippet: true
  },
  {
    label: 'unordered_set',
    kind: 'class',
    detail: 'template <class Key> class std::unordered_set',
    documentation:
      'Associative container that contains a set of unique objects of type Key (hash table).',
    insertText: 'unordered_set<${1:int}>',
    isSnippet: true
  },
  {
    label: 'pair',
    kind: 'class',
    detail: 'template <class T1, class T2> struct std::pair',
    documentation:
      'Class template that provides a way to store two heterogeneous objects as a single unit.',
    insertText: 'pair<${1:int}, ${2:int}>',
    isSnippet: true
  },
  {
    label: 'make_pair',
    kind: 'function',
    detail: 'std::pair<T1, T2> std::make_pair(T1&& t, T2&& u)',
    documentation:
      'Creates a std::pair object, deducing the target type from the types of arguments.',
    insertText: 'make_pair(${1:first}, ${2:second})',
    isSnippet: true
  },
  {
    label: 'unique_ptr',
    kind: 'class',
    detail: 'template <class T> class std::unique_ptr',
    documentation:
      'Smart pointer that owns and manages another object through a pointer and disposes of it when out of scope.',
    insertText: 'unique_ptr<${1:Type}>',
    isSnippet: true
  },
  {
    label: 'make_unique',
    kind: 'function',
    detail: 'std::unique_ptr<T> std::make_unique(Args&&... args)',
    documentation: 'Constructs an object of type T and wraps it in a std::unique_ptr.',
    insertText: 'make_unique<${1:Type}>(${2})',
    isSnippet: true
  },
  {
    label: 'shared_ptr',
    kind: 'class',
    detail: 'template <class T> class std::shared_ptr',
    documentation: 'Smart pointer that retains shared ownership of an object through a pointer.',
    insertText: 'shared_ptr<${1:Type}>',
    isSnippet: true
  },
  {
    label: 'make_shared',
    kind: 'function',
    detail: 'std::shared_ptr<T> std::make_shared(Args&&... args)',
    documentation:
      'Allocates and constructs an object of type T and wraps it in a std::shared_ptr.',
    insertText: 'make_shared<${1:Type}>(${2})',
    isSnippet: true
  },
  {
    label: 'sort',
    kind: 'function',
    detail: 'void std::sort(RandomIt first, RandomIt last)',
    documentation: 'Sorts the elements in the range [first, last) in non-descending order.',
    insertText: 'sort(${1:v}.begin(), ${1:v}.end())',
    isSnippet: true
  },
  {
    label: 'find',
    kind: 'function',
    detail: 'InputIt std::find(InputIt first, InputIt last, const T& value)',
    documentation:
      'Returns an iterator to the first element in the range [first, last) that equals value.',
    insertText: 'find(${1:v}.begin(), ${1:v}.end(), ${2:target})',
    isSnippet: true
  },
  {
    label: 'reverse',
    kind: 'function',
    detail: 'void std::reverse(BidirIt first, BidirIt last)',
    documentation: 'Reverses the order of the elements in the range [first, last).',
    insertText: 'reverse(${1:v}.begin(), ${1:v}.end())',
    isSnippet: true
  },
  {
    label: 'accumulate',
    kind: 'function',
    detail: 'T std::accumulate(InputIt first, InputIt last, T init)',
    documentation:
      'Computes the sum of the given value init and the elements in the range [first, last).',
    insertText: 'accumulate(${1:v}.begin(), ${1:v}.end(), ${2:0})',
    isSnippet: true
  },
  {
    label: 'max',
    kind: 'function',
    detail: 'const T& std::max(const T& a, const T& b)',
    documentation: 'Returns the greater of the given values.',
    insertText: 'max(${1:a}, ${2:b})',
    isSnippet: true
  },
  {
    label: 'min',
    kind: 'function',
    detail: 'const T& std::min(const T& a, const T& b)',
    documentation: 'Returns the smaller of the given values.',
    insertText: 'min(${1:a}, ${2:b})',
    isSnippet: true
  },
  {
    label: 'swap',
    kind: 'function',
    detail: 'void std::swap(T& a, T& b)',
    documentation: 'Exchanges the given values.',
    insertText: 'swap(${1:a}, ${2:b})',
    isSnippet: true
  },
  {
    label: 'move',
    kind: 'function',
    detail: 'typename std::remove_reference<T>::type&& std::move(T&& t) noexcept',
    documentation: 'Casts an lvalue to an xvalue to indicate that an object may be moved from.',
    insertText: 'move(${1:obj})',
    isSnippet: true
  },
  {
    label: 'to_string',
    kind: 'function',
    detail: 'std::string std::to_string(Numeric value)',
    documentation: 'Converts a numeric value to std::string.',
    insertText: 'to_string(${1:val})',
    isSnippet: true
  }
]

const STL_VECTOR_MEMBERS: CppMemberMeta[] = [
  {
    label: 'push_back',
    kind: 'method',
    detail: 'void push_back(const T& value)',
    documentation: 'Appends the given element value to the end of the container.',
    insertText: 'push_back(${1:value})',
    isSnippet: true
  },
  {
    label: 'emplace_back',
    kind: 'method',
    detail: 'reference emplace_back(Args&&... args)',
    documentation: 'Appends a new element to the end of the container, constructed in-place.',
    insertText: 'emplace_back(${1:args})',
    isSnippet: true
  },
  {
    label: 'pop_back',
    kind: 'method',
    detail: 'void pop_back()',
    documentation: 'Removes the last element of the container.',
    insertText: 'pop_back()'
  },
  {
    label: 'size',
    kind: 'method',
    detail: 'size_type size() const noexcept',
    documentation: 'Returns the number of elements in the container.',
    insertText: 'size()'
  },
  {
    label: 'empty',
    kind: 'method',
    detail: 'bool empty() const noexcept',
    documentation: 'Checks if the container has no elements.',
    insertText: 'empty()'
  },
  {
    label: 'clear',
    kind: 'method',
    detail: 'void clear() noexcept',
    documentation: 'Erases all elements from the container.',
    insertText: 'clear()'
  },
  {
    label: 'begin',
    kind: 'method',
    detail: 'iterator begin() noexcept',
    documentation: 'Returns an iterator to the beginning of the container.',
    insertText: 'begin()'
  },
  {
    label: 'end',
    kind: 'method',
    detail: 'iterator end() noexcept',
    documentation: 'Returns an iterator to the end (past-the-last element) of the container.',
    insertText: 'end()'
  },
  {
    label: 'front',
    kind: 'method',
    detail: 'reference front()',
    documentation: 'Returns a reference to the first element in the container.',
    insertText: 'front()'
  },
  {
    label: 'back',
    kind: 'method',
    detail: 'reference back()',
    documentation: 'Returns a reference to the last element in the container.',
    insertText: 'back()'
  },
  {
    label: 'resize',
    kind: 'method',
    detail: 'void resize(size_type count)',
    documentation: 'Resizes the container to contain count elements.',
    insertText: 'resize(${1:count})',
    isSnippet: true
  },
  {
    label: 'reserve',
    kind: 'method',
    detail: 'void reserve(size_type new_cap)',
    documentation: 'Increases the capacity of the vector to a value greater or equal to new_cap.',
    insertText: 'reserve(${1:cap})',
    isSnippet: true
  }
]

const STL_STRING_MEMBERS: CppMemberMeta[] = [
  {
    label: 'length',
    kind: 'method',
    detail: 'size_type length() const noexcept',
    documentation: 'Returns the number of characters in the string.',
    insertText: 'length()'
  },
  {
    label: 'size',
    kind: 'method',
    detail: 'size_type size() const noexcept',
    documentation: 'Returns the number of characters in the string.',
    insertText: 'size()'
  },
  {
    label: 'empty',
    kind: 'method',
    detail: 'bool empty() const noexcept',
    documentation: 'Checks whether the string is empty.',
    insertText: 'empty()'
  },
  {
    label: 'substr',
    kind: 'method',
    detail: 'std::string substr(size_type pos = 0, size_type count = npos) const',
    documentation: 'Returns a substring [pos, pos + count).',
    insertText: 'substr(${1:pos}, ${2:count})',
    isSnippet: true
  },
  {
    label: 'find',
    kind: 'method',
    detail: 'size_type find(const std::string& str, size_type pos = 0) const noexcept',
    documentation: 'Finds the first substring equal to the given character sequence.',
    insertText: 'find(${1:str})',
    isSnippet: true
  },
  {
    label: 'c_str',
    kind: 'method',
    detail: 'const char* c_str() const noexcept',
    documentation:
      'Returns a pointer to a null-terminated character array with data equivalent to the string.',
    insertText: 'c_str()'
  },
  {
    label: 'append',
    kind: 'method',
    detail: 'std::string& append(const std::string& str)',
    documentation: 'Appends additional characters to the string.',
    insertText: 'append(${1:str})',
    isSnippet: true
  },
  {
    label: 'replace',
    kind: 'method',
    detail: 'std::string& replace(size_type pos, size_type count, const std::string& str)',
    documentation:
      'Replaces the part of the string indicated by [pos, pos + count) with a new string.',
    insertText: 'replace(${1:pos}, ${2:count}, ${3:str})',
    isSnippet: true
  }
]

const STL_MAP_SET_MEMBERS: CppMemberMeta[] = [
  {
    label: 'insert',
    kind: 'method',
    detail: 'std::pair<iterator, bool> insert(const value_type& value)',
    documentation:
      'Inserts element(s) into the container, if the container does not already contain an element with an equivalent key.',
    insertText: 'insert(${1:value})',
    isSnippet: true
  },
  {
    label: 'emplace',
    kind: 'method',
    detail: 'std::pair<iterator, bool> emplace(Args&&... args)',
    documentation:
      'Inserts a new element into the container constructed in-place with the given args.',
    insertText: 'emplace(${1:args})',
    isSnippet: true
  },
  {
    label: 'find',
    kind: 'method',
    detail: 'iterator find(const Key& key)',
    documentation: 'Finds an element with key equivalent to key.',
    insertText: 'find(${1:key})',
    isSnippet: true
  },
  {
    label: 'contains',
    kind: 'method',
    detail: 'bool contains(const Key& key) const (C++20)',
    documentation: 'Checks if there is an element with key equivalent to key in the container.',
    insertText: 'contains(${1:key})',
    isSnippet: true
  },
  {
    label: 'count',
    kind: 'method',
    detail: 'size_type count(const Key& key) const',
    documentation:
      'Returns the number of elements with key that compares equivalent to the specified argument.',
    insertText: 'count(${1:key})',
    isSnippet: true
  },
  {
    label: 'erase',
    kind: 'method',
    detail: 'size_type erase(const Key& key)',
    documentation: 'Removes specified elements from the container.',
    insertText: 'erase(${1:key})',
    isSnippet: true
  },
  {
    label: 'size',
    kind: 'method',
    detail: 'size_type size() const noexcept',
    documentation: 'Returns the number of elements in the container.',
    insertText: 'size()'
  },
  {
    label: 'empty',
    kind: 'method',
    detail: 'bool empty() const noexcept',
    documentation: 'Checks if the container has no elements.',
    insertText: 'empty()'
  },
  {
    label: 'clear',
    kind: 'method',
    detail: 'void clear() noexcept',
    documentation: 'Erases all elements from the container.',
    insertText: 'clear()'
  },
  {
    label: 'begin',
    kind: 'method',
    detail: 'iterator begin() noexcept',
    documentation: 'Returns an iterator to the beginning.',
    insertText: 'begin()'
  },
  {
    label: 'end',
    kind: 'method',
    detail: 'iterator end() noexcept',
    documentation: 'Returns an iterator to the end.',
    insertText: 'end()'
  }
]

const GLOBAL_C_CPP_FUNCTIONS: CppMemberMeta[] = [
  {
    label: 'printf',
    kind: 'function',
    detail: 'int printf(const char* format, ...)',
    documentation: 'Writes formatted output to stdout.',
    insertText: 'printf("${1:%d}\\n", ${2:value});',
    isSnippet: true
  },
  {
    label: 'puts',
    kind: 'function',
    detail: 'int puts(const char* str)',
    documentation:
      'Writes every character from the null-terminated string str and one additional newline character to stdout.',
    insertText: 'puts("${1:hello}");',
    isSnippet: true
  },
  {
    label: 'scanf',
    kind: 'function',
    detail: 'int scanf(const char* format, ...)',
    documentation: 'Reads formatted data from stdin.',
    insertText: 'scanf("${1:%d}", &${2:var});',
    isSnippet: true
  },
  {
    label: 'malloc',
    kind: 'function',
    detail: 'void* malloc(size_t size)',
    documentation: 'Allocates size bytes of uninitialized storage on the heap.',
    insertText: 'malloc(sizeof(${1:int}) * ${2:n})',
    isSnippet: true
  },
  {
    label: 'calloc',
    kind: 'function',
    detail: 'void* calloc(size_t num, size_t size)',
    documentation:
      'Allocates memory for an array of num objects of size and initializes all bytes to zero.',
    insertText: 'calloc(${1:n}, sizeof(${2:int}))',
    isSnippet: true
  },
  {
    label: 'free',
    kind: 'function',
    detail: 'void free(void* ptr)',
    documentation:
      'Deallocates the space previously allocated by malloc(), calloc(), or realloc().',
    insertText: 'free(${1:ptr});',
    isSnippet: true
  },
  {
    label: 'memcpy',
    kind: 'function',
    detail: 'void* memcpy(void* dest, const void* src, size_t count)',
    documentation:
      'Copies count bytes from the object pointed to by src to the object pointed to by dest.',
    insertText: 'memcpy(${1:dest}, ${2:src}, ${3:size});',
    isSnippet: true
  },
  {
    label: 'memset',
    kind: 'function',
    detail: 'void* memset(void* dest, int ch, size_t count)',
    documentation:
      'Copies the value ch into each of the first count characters of the object pointed to by dest.',
    insertText: 'memset(${1:dest}, ${2:0}, sizeof(${1:dest}));',
    isSnippet: true
  },
  {
    label: 'strlen',
    kind: 'function',
    detail: 'size_t strlen(const char* str)',
    documentation: 'Returns the length of the given null-terminated byte string.',
    insertText: 'strlen(${1:str})',
    isSnippet: true
  },
  {
    label: 'strcmp',
    kind: 'function',
    detail: 'int strcmp(const char* lhs, const char* rhs)',
    documentation: 'Compares two null-terminated byte strings lexicographically.',
    insertText: 'strcmp(${1:s1}, ${2:s2})',
    isSnippet: true
  },
  {
    label: 'sizeof',
    kind: 'function',
    detail: 'size_t sizeof(type / expression)',
    documentation:
      'Queries the size in bytes of the object representation of a type or expression.',
    insertText: 'sizeof(${1:int})',
    isSnippet: true
  }
]

const CPP_SNIPPETS: Array<{
  label: string
  detail: string
  documentation: string
  insertText: string
  cppOnly?: boolean
}> = [
  {
    label: 'main',
    detail: 'int main() entry point',
    documentation: 'Standard C/C++ main function entry point.',
    insertText: 'int main() {\n\t${1}\n\treturn 0;\n}'
  },
  {
    label: 'include',
    detail: '#include <header>',
    documentation: 'Preprocessor include directive for standard headers.',
    insertText: '#include <${1:iostream}>'
  },
  {
    label: 'cout',
    detail: 'std::cout << ... << std::endl;',
    documentation: 'Print line to standard output stream.',
    insertText: 'std::cout << ${1:value} << std::endl;',
    cppOnly: true
  },
  {
    label: 'for',
    detail: 'for (int i = 0; i < n; ++i)',
    documentation: 'Standard index-based for loop.',
    insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n\t${3}\n}'
  },
  {
    label: 'forr',
    detail: 'for (const auto& item : container)',
    documentation: 'C++11 range-based for loop.',
    insertText: 'for (const auto& ${1:item} : ${2:container}) {\n\t${3}\n}',
    cppOnly: true
  },
  {
    label: 'struct',
    detail: 'struct Name { ... };',
    documentation: 'Define a C/C++ struct.',
    insertText: 'struct ${1:Node} {\n\t${2:int val;}\n};'
  },
  {
    label: 'class',
    detail: 'class Name { public: ... };',
    documentation: 'Define a C++ class.',
    insertText: 'class ${1:MyClass} {\npublic:\n\t${1:MyClass}() = default;\n\t${2}\n};',
    cppOnly: true
  }
]

type InferredContainerKind = 'vector' | 'string' | 'map_or_set' | 'unknown'

function inferCppVariableTypes(code: string): Map<string, InferredContainerKind> {
  const map = new Map<string, InferredContainerKind>()
  const vecRegex = /\b(?:std::)?(?:vector|deque|list)\s*<[^>;]+>\s+([A-Za-z_]\w*)/g
  let m: RegExpExecArray | null
  while ((m = vecRegex.exec(code)) !== null) {
    if (m[1]) map.set(m[1], 'vector')
  }

  const strRegex = /\b(?:std::)?string\s+([A-Za-z_]\w*)/g
  while ((m = strRegex.exec(code)) !== null) {
    if (m[1]) map.set(m[1], 'string')
  }

  const mapSetRegex =
    /\b(?:std::)?(?:unordered_)?(?:map|set|multimap|multiset)\s*<[^>;]+>\s+([A-Za-z_]\w*)/g
  while ((m = mapSetRegex.exec(code)) !== null) {
    if (m[1]) map.set(m[1], 'map_or_set')
  }

  return map
}

let cppIntellisenseRegistered = false

export function registerCppIntelliSense(monaco: MonacoModule) {
  if (cppIntellisenseRegistered) return
  cppIntellisenseRegistered = true

  const Kind = monaco.languages.CompletionItemKind
  const InsertRule = monaco.languages.CompletionItemInsertTextRule

  function toMonacoKind(k: CppMemberMeta['kind']) {
    switch (k) {
      case 'method':
        return Kind.Method
      case 'property':
        return Kind.Property
      case 'class':
        return Kind.Class
      case 'function':
        return Kind.Function
      case 'constant':
        return Kind.Constant
    }
  }

  for (const langId of ['c', 'cpp'] as const) {
    const isCpp = langId === 'cpp'

    monaco.languages.registerCompletionItemProvider(langId, {
      triggerCharacters: ['.', ':', '>', '<', '/'],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }
        const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)
        const fullText = model.getValue()

        // 1. #include <...> 头文件补全
        if (/^\s*#\s*include\s*<[^>]*$/.test(linePrefix)) {
          return {
            suggestions: C_CPP_HEADERS.filter((h) => isCpp || !h.cppOnly).map((h) => ({
              label: h.header,
              kind: Kind.Module,
              detail: `<${h.header}>`,
              documentation: h.desc,
              insertText: h.header,
              range
            }))
          }
        }

        // 2. std:: 命名空间补全
        if (isCpp && /\bstd::\w*$/.test(linePrefix)) {
          return {
            suggestions: STD_NAMESPACE_MEMBERS.map((m) => ({
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

        // 3. 变量实例 . 或 -> 成员补全
        const memberAccessMatch = linePrefix.match(/([A-Za-z_]\w*)\s*(?:\.|->)\s*\w*$/)
        if (isCpp && memberAccessMatch && memberAccessMatch[1]) {
          const receiver = memberAccessMatch[1]
          const varTypes = inferCppVariableTypes(fullText)
          const inferred = varTypes.get(receiver)

          let pool: CppMemberMeta[] = []
          if (inferred === 'vector') {
            pool = STL_VECTOR_MEMBERS
          } else if (inferred === 'string') {
            pool = STL_STRING_MEMBERS
          } else if (inferred === 'map_or_set') {
            pool = STL_MAP_SET_MEMBERS
          } else {
            // 未显式声明时提供常见 STL 容器通用成员合集
            const seen = new Set<string>()
            for (const item of [
              ...STL_VECTOR_MEMBERS,
              ...STL_STRING_MEMBERS,
              ...STL_MAP_SET_MEMBERS
            ]) {
              if (!seen.has(item.label)) {
                seen.add(item.label)
                pool.push(item)
              }
            }
          }

          return {
            suggestions: pool.map((m) => ({
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

        // 4. 顶层全局补全（C 标准库函数 + C++ std 符号 + Snippets）
        const suggestions: Monaco.languages.CompletionItem[] = []

        for (const fn of GLOBAL_C_CPP_FUNCTIONS) {
          suggestions.push({
            label: fn.label,
            kind: toMonacoKind(fn.kind),
            detail: fn.detail,
            documentation: fn.documentation,
            insertText: fn.insertText,
            insertTextRules: fn.isSnippet ? InsertRule.InsertAsSnippet : undefined,
            range
          })
        }

        if (isCpp) {
          for (const m of STD_NAMESPACE_MEMBERS) {
            suggestions.push({
              label: m.label,
              kind: toMonacoKind(m.kind),
              detail: m.detail,
              documentation: m.documentation,
              insertText: m.insertText,
              insertTextRules: m.isSnippet ? InsertRule.InsertAsSnippet : undefined,
              range
            })
          }
        }

        for (const snip of CPP_SNIPPETS) {
          if (!isCpp && snip.cppOnly) continue
          suggestions.push({
            label: snip.label,
            kind: Kind.Snippet,
            detail: snip.detail,
            documentation: snip.documentation,
            insertText: snip.insertText,
            insertTextRules: InsertRule.InsertAsSnippet,
            range
          })
        }

        return { suggestions }
      }
    })

    monaco.languages.registerHoverProvider(langId, {
      provideHover(model, position) {
        const wordInfo = model.getWordAtPosition(position)
        if (!wordInfo) return null
        const word = wordInfo.word

        const allMeta = [
          ...GLOBAL_C_CPP_FUNCTIONS,
          ...STD_NAMESPACE_MEMBERS,
          ...STL_VECTOR_MEMBERS,
          ...STL_STRING_MEMBERS,
          ...STL_MAP_SET_MEMBERS
        ]
        const hit = allMeta.find((m) => m.label === word)
        if (!hit) return null

        return {
          range: new monaco.Range(
            position.lineNumber,
            wordInfo.startColumn,
            position.lineNumber,
            wordInfo.endColumn
          ),
          contents: [{ value: `\`\`\`cpp\n${hit.detail}\n\`\`\`` }, { value: hit.documentation }]
        }
      }
    })
  }
}
