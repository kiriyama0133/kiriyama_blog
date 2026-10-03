export const useNavigationStack = () => {
  const stack = useState<string[]>('nav-stack', () => [])
  const canGoBack = computed(() => stack.value.length >= 2)
  const router = useRouter()
  function push(path: string) {
    if (stack.value[stack.value.length - 1] === path) return
    stack.value.push(path)
    if (stack.value.length > 50) {
      stack.value.shift()
    }
  }

  function pop(): string | undefined {
    stack.value.pop()
    return stack.value[stack.value.length - 1]
  }
  function goBack(fallback = '/') {
    if (stack.value.length < 2) {
      router.push(fallback)
      return
    }
    const prev = stack.value[stack.value.length - 2]
    router.push(prev!)
  }
  function clear() {
    stack.value = []
  }

  function getPrevious(): string | undefined {
    return stack.value[stack.value.length - 2]
  }
  return {
    stack: readonly(stack),
    push,
    pop,
    clear,
    getPrevious,
    goBack,
    canGoBack
  }
}
