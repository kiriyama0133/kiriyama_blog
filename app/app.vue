<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- 全站唯一的「回到顶部」，放在这里三个 layout 都能用 -->
  <BackToTop />
  <!-- 全站唯一的轻提示出口，状态在 composables/useNotice.ts -->
  <Notice />
  <!-- 明暗切换：和 FloatingMenu 同一行的右侧 -->
  <ThemeToggle />
  <!-- 全站唯一的代码演练场弹窗，状态在 composables/usePlayground.ts -->
  <ClientOnly><PlaygroundDialog /></ClientOnly>
</template>

<script setup lang="ts">
/**
 * `<html lang>` 不会自己跟着语言变，得手动挂。
 *
 * 刻意不用 `useLocaleHead()`：它同时会输出 canonical / hreflang，而站点用的是
 * `strategy: 'no_prefix'`（所有语言共用同一个 URL），那些标签只会指向页面自己，
 * 没有意义，还会因为没配 baseUrl 刷一串警告。这里只取需要的那一个属性。
 */
const { localeProperties } = useI18n()

useHead({
  htmlAttrs: {
    lang: computed(() => localeProperties.value.language ?? localeProperties.value.code)
  }
})
</script>
