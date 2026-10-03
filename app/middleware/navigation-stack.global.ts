import { canonicalPath } from '~/utils/path'

export default defineNuxtRouteMiddleware((to, _from) => {
  if (import.meta.server) return

  const { stack, push, pop } = useNavigationStack()

  // 用规范路径入栈：静态托管下目录索引会被 301 补尾斜杠，原样存会导致回退/判重全部失配
  const target = canonicalPath(to.path)
  const isBack = stack.value.length >= 2 && stack.value[stack.value.length - 2] === target

  if (isBack) {
    pop()
  } else {
    push(target)
  }
})
