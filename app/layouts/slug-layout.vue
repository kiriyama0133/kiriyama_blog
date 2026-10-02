<script setup lang="ts">
import { onUnmounted } from 'vue'
import RightRail from '~/components/RightRail.vue'
import TocFanNav from '~/components/TocFanNav.vue'
import { useReaderStore } from '~/stores/reader'

const reader = useReaderStore()

onUnmounted(() => reader.clear())
</script>

<template>
  <div class="layout">
    <main class="layout-main">
      <slot />
    </main>
    <RightRail fan-width="13rem">
      <TocFanNav v-if="reader.hasToc" class="hidden md:block" />
    </RightRail>
  </div>
</template>

<style lang="scss" scoped>
:global(::-webkit-scrollbar) {
  width: 0;
  height: 0;
  display: none;
}
</style>
