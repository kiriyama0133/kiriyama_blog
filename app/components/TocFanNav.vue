<!--
  TocFanNav —— 文档内锚点（## 标题）的扇形导航。

  与 RightTabWithNav（文档列表）的区别只有一个：**不追踪窗口**。
  这里用 FanVirtualList 的默认 driver="self"，扇形的前位完全由它自己那条
  滚动轨道决定，所以用户可以像普通列表一样滚它，点某一条则：
    1) 让页面平滑滚到对应 heading；
    2) 把该条目平滑滚到扇形的「前位」。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import FanVirtualList from '~/components/FanVirtualList.vue'
import { useReaderStore } from '~/stores/reader'

withDefaults(
  defineProps<{
    itemHeight?: number
    radius?: number
    maxAngle?: number
    fade?: number
    orientation?: 'upright' | 'tangent' | 'radial'
    anchorX?: number
    anchorY?: number
  }>(),
  {
    // 锚点文字比文档标题短，轨道间距收紧一点，弧看起来更连贯
    itemHeight: 44,
    radius: 460,
    maxAngle: 48,
    fade: 0.2,
    orientation: 'tangent',
    anchorX: 0.7,
    anchorY: 0.5
  }
)

const reader = useReaderStore()
const fan = ref<InstanceType<typeof FanVirtualList> | null>(null)

const items = computed(() => reader.toc)

function onPick(id: string, index: number) {
  reader.jumpTo(id)
  // 页面与轨道同时平滑移动：前者到章节，后者把这条转到前位
  fan.value?.scrollToIndex(index, 'smooth')
}
</script>

<template>
  <div class="toc-fan">
    <FanVirtualList
      ref="fan"
      class="toc-fan__list"
      :items="items"
      :item-height="itemHeight"
      :radius="radius"
      :max-angle="maxAngle"
      :fade="fade"
      :orientation="orientation"
      :anchor-x="anchorX"
      :anchor-y="anchorY"
      end-padding="container"
    >
      <template #default="{ item, index, active }">
        <button
          type="button"
          class="toc-link"
          :class="{ 'toc-link--front': active, 'toc-link--active': reader.activeId === item.id }"
          :style="{ paddingLeft: `${0.55 + (item.depth - 2) * 0.6}rem` }"
          :title="item.text"
          @click="onPick(item.id, index)"
        >
          <span class="toc-link__text">{{ item.text }}</span>
        </button>
      </template>
    </FanVirtualList>
  </div>
</template>

<style lang="scss" scoped>
.toc-fan {
  height: min(100vh, 30rem);
}

.toc-fan__list {
  height: 100%;
}

.toc-link {
  display: block;
  width: 8.5rem;
  padding: 0.4rem 0.7rem;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background-color: transparent;
  /* 用 main.css 的语义变量，跟着 .dark 自己翻（@theme 的变量是按需输出的，别直接用） */
  color: var(--ui-text);
  font-size: 0.8125rem;
  line-height: 1.1rem;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 0.2s,
    box-shadow 0.2s;

  &:hover {
    color: var(--ui-text-strong);
  }
}

// 落在扇形「前位」的那一条（距离锚点最近）
.toc-link--front {
  box-shadow: 0 6px 18px -8px rgb(0 0 0 / 0.35);
}

// 当前正在阅读的章节
.toc-link--active {
  color: var(--ui-text-strong);
  font-weight: 600;
}

.toc-link__text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
