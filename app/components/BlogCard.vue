<script setup lang="ts">
defineProps<{ path: string }>()
</script>

<template>
  <NuxtLink :to="path">
    <div class="card group transition-all">
        <h2 class="group-hover:text-light-button-hover transition-all">
            <slot name="title">默认标题</slot>
        </h2>
        <p>
            <slot name="summary">默认摘要</slot>
        </p>
    </div>
  </NuxtLink>
</template>