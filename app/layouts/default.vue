<template>
    <div class="layout">
    <main class="layout-main">
      <slot />
    </main>
    <ClientOnly>
      <RightTab class="right_tab" />
    </ClientOnly>
    </div>
</template>
<script lang="ts">
import RightTab from '~/components/RightTab.vue'
</script>

<style lang="scss" scoped>
.right_tab {
  position: fixed;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
:global(::-webkit-scrollbar) {
  width: 0;
  height: 0;
  display: none;
}
</style>