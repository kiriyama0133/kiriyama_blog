<script setup lang="ts">
// date 为 `YYYY-MM-DD`；空串（笔记没写 frontmatter date）时整行不渲染
defineProps<{ path: string; date?: string }>()
</script>

<template>
  <NuxtLink :to="path">
    <div class="card group transition-all">
      <h2
        class="group-hover:text-light-button-hover dark:group-hover:text-dark-button-hover transition-all"
      >
        <slot name="title">{{ $t('card.defaultTitle') }}</slot>
      </h2>
      <time v-if="date" class="card-date" :datetime="date">{{ date }}</time>
      <p>
        <slot name="summary">{{ $t('card.defaultSummary') }}</slot>
      </p>
    </div>
  </NuxtLink>
</template>

<style lang="scss" scoped>
// 组件 scoped 样式是未分层样式，会压过 main.css 里 @layer components 的规则，
// 所以配色用跟着 .dark 翻的 --ui-* 变量，而不是 dark: 工具类。
.card-date {
  display: block;
  // 与标题的 0.85rem 下边距折叠，取大者，这里只补一点点
  margin-top: 0.15rem;
  font-size: 0.75rem;
  line-height: 1.3;
  letter-spacing: 0.02em;
  color: var(--ui-text-muted);
}
</style>
