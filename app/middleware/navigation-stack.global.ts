export default defineNuxtRouteMiddleware((to, _from) => {
  if (import.meta.server) return

  const { stack, push, pop } = useNavigationStack()

  // console.log('导航:', { from: from.fullPath, to: to.fullPath, stack: [...stack.value] })

  const isBack = stack.value.length >= 2 && stack.value[stack.value.length - 2] === to.fullPath

  // console.log('isBack:', isBack)

  if (isBack) {
    pop()
  } else {
    push(to.fullPath)
  }
})
