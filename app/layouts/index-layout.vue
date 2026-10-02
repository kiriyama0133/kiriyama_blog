<template>
    <div class="layout">
    <main class="layout-main">
      <slot />
    </main>
    <RightTabWithNav />
    </div>
</template>
<script lang="ts">
import RightTabWithNav from '~/components/RightTabWithNav.vue'
</script>

<style lang="scss" scoped>
:global(::-webkit-scrollbar) {
  width: 0;
  height: 0;
  display: none;
}
</style>
