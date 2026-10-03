<!-- app/components/RightTabWithNav.vue -->
<!-- 文档列表导航：扇形里是全部文档，跟随页面滚动（driver="window"） -->
<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '~/stores/content'
import FanVirtualList from '~/components/FanVirtualList.vue'
import RightRail from '~/components/RightRail.vue'
import { canonicalPath } from '~/utils/path'

const store = useContentStore()
const route = useRoute()

const items = computed(() => store.summaries)

// route.path 带编码和尾斜杠，item.path 是解码原文，先规范再比
const currentPath = computed(() => canonicalPath(route.path))

function isActive(path: string) {
  return currentPath.value === path
}
</script>

<template>
  <RightRail>
    <FanVirtualList
      class="fan"
      :items="items"
      driver="window"
      :item-height="56"
      :radius="520"
      :max-angle="40"
      :fade="0.85"
      orientation="tangent"
      :anchor-x="0.62"
      :anchor-y="0.5"
    >
      <template #default="{ item, active }">
        <NuxtLink
          :to="item.path"
          class="doc-link hidden truncate md:block"
          :class="{ 'doc-link--front': active, 'doc-link--active': isActive(item.path) }"
        >
          {{ item.title }}
        </NuxtLink>
      </template>
    </FanVirtualList>
  </RightRail>
</template>

<style lang="scss" scoped>
.fan {
  height: min(100vh, 34rem);
}

.doc-link {
  width: 8rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.15rem;
  text-decoration: none;
  box-shadow: 0 0 0 0 transparent;
}

.doc-link--front {
  box-shadow: 0 6px 18px -8px rgb(0 0 0 / 0.35);
}

.doc-link--active {
  font-weight: 600;
}
</style>
