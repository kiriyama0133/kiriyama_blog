import { computed } from 'vue'
import { useClipboard, useShare } from '@vueuse/core'
import { useReaderStore } from '~/stores/reader'
import { useSiteMeta } from '~/composables/useSiteMeta'
import { useNotice } from '~/composables/useNotice'

/**
 * 「分享当前笔记」。
 */
export function useShareNote() {
  const reader = useReaderStore()
  const { notify } = useNotice()
  const { t } = useI18n()
  const { pageTitle } = useSiteMeta()

  const title = computed(() => pageTitle(reader.title))
  const text = computed(() => reader.description || undefined)
  const url = computed(() => {
    if (import.meta.server || !reader.path) return ''
    return new URL(reader.path, window.location.origin).href
  })

  const { share, isSupported } = useShare(() => ({
    title: title.value,
    text: text.value,
    url: url.value
  }))

  const { copy, isSupported: canCopy } = useClipboard()

  async function shareNote() {
    if (isSupported.value) {
      try {
        await share()
        return
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return
      }
    }

    if (canCopy.value && url.value) {
      await copy(url.value)
      notify(t('notice.linkCopied'))
      return
    }

    notify(t('notice.shareUnsupported'))
  }

  return { title, text, url, isSupported, shareNote }
}
