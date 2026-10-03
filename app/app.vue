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
</template>

<script setup lang="ts"></script>
