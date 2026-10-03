/**
 * 轻提示（toast）。
 */
export function useNotice() {
  const message = useState('notice-message', () => '')

  /** 提示停留时长（ms） */
  const duration = 2000

  let timer: ReturnType<typeof setTimeout> | undefined

  function notify(text: string) {
    message.value = text
    clearTimeout(timer)
    timer = setTimeout(() => {
      message.value = ''
      timer = undefined
    }, duration)
  }

  function clear() {
    clearTimeout(timer)
    timer = undefined
    message.value = ''
  }

  return { message, notify, clear }
}
