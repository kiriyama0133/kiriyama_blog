<!--
  FanVirtualList —— 沿固定圆弧排布、滚动时绕圆心旋转的虚拟列表容器

  思路：
  1) 滚动轨道仍然是「直线」的（useVirtualList 提供），itemHeight = 每条的轨道间距；
  2) 把「轨道距离」换算成「圆心角」：theta = (progress - index) * itemHeight / radius；
  3) 由 theta 反算极坐标位置，得到固定角度步进的弧（扇形）排布；
  4) 只渲染落在 maxAngle 以内的条目 —— 这就是"虚拟"的部分。
  几何部分全部在 `~/composables/useFanArc`，这里只管轨道、窗口与滚动。

  驱动方式（driver）：
  - 'self'   由容器自己的滚动条驱动（文档内锚点跳转用这个）
  - 'window' 由窗口滚动驱动，取法和 RightTab 一样：
               pageProgress = scrollY / (documentElement.scrollHeight - innerHeight)
             再乘 windowSpan 得到「前位」索引。纯绝对值映射，没有增量累积。

  'window' 模式下轨道 scrollTop 依旧由 useVirtualList 消费，只是被我们
  直接赋值同步过去（绝对值），所以取窗口逻辑一行都不用改；
  容器换成 overflow:hidden = 「用户不可滚、脚本可滚」，滚轮自然穿透给页面。
-->
<script setup lang="ts" generic="T">
import { computed, ref, watchEffect } from 'vue'
import type { Ref } from 'vue'
import { useElementSize, useScroll, useVirtualList, useWindowScroll, useWindowSize } from '@vueuse/core'
import { useFanArc } from '~/composables/useFanArc'
import type { FanOrientation } from '~/composables/useFanArc'

type Driver = 'self' | 'window'
/** 轨道末尾留白：'auto' = window 模式补一个容器高；'container' = 总是补；数字 = 补这么多 px */
type EndPadding = 'auto' | 'container' | number

const props = withDefaults(
  defineProps<{
    /** 数据源 */
    items: T[]
    /** 每条在滚动轨道上占的高度(px)。和 radius 一起决定角度步进 */
    itemHeight?: number
    /** 圆心到「前位」的距离(px)。越小 → 弧越弯、条目倾角越大 */
    radius?: number
    /** 超过这个偏角(deg)就不再渲染 */
    maxAngle?: number
    /** 条目自身朝向：不转 / 沿弧切线(扇骨) / 指向圆心(放射) */
    orientation?: FanOrientation
    /** 「前位」在容器里的锚点，0~1 */
    anchorX?: number
    anchorY?: number
    /** 远离前位时的淡出强度，0 = 不淡出，1 = 到 maxAngle 处完全透明 */
    fade?: number
    /** 谁来驱动旋转 */
    driver?: Driver
    /** 页面滚完一整程，扇形走多少个条目。0 = 整份列表（默认） */
    windowSpan?: number
    /** 轨道末尾额外留白，让最后的条目也能滚到「前位」 */
    endPadding?: EndPadding
  }>(),
  {
    itemHeight: 56,
    radius: 520,
    maxAngle: 40,
    orientation: 'tangent',
    anchorX: 0.32,
    anchorY: 0.5,
    fade: 0.85,
    driver: 'self',
    windowSpan: 0,
    endPadding: 'auto',
  },
)

const root = ref<HTMLElement | null>(null)
const { width: boxW, height: boxH } = useElementSize(root)

/** 每条跨越的圆心角（角度）。和 useFanArc 里那份是同一个式子，这里只为了定 overscan */
const stepDeg = computed(() => (props.itemHeight / props.radius) * (180 / Math.PI))

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  computed(() => props.items),
  {
    itemHeight: () => props.itemHeight,
    // 窗口必须比可见角度范围更宽，否则弧上的条目会被提前卸掉
    overscan: Math.ceil(props.maxAngle / stepDeg.value) + 3,
  },
)

const scrollerRef = containerProps.ref as Ref<HTMLElement | null>
const { y: scrollTop } = useScroll(scrollerRef)

/* ---------------- 窗口滚动进度：和 RightTab 同一套取法 ---------------- */

const { y: windowY } = useWindowScroll()
const { height: viewportH } = useWindowSize()

/** 页面滚动进度 0~1 */
const pageProgress = computed(() => {
  if (typeof document === 'undefined') return 0
  // viewportH 是响应式的，窗口缩放会触发重算；scrollHeight 每次现读，
  // 页面内容变高后（懒加载图片、字体回填）下一次滚动就会自动修正。
  const max = document.documentElement.scrollHeight - viewportH.value
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, windowY.value / max))
})

/** 整程页面对应列表里的多少个条目（0 = 整份列表） */
const span = computed(() =>
  props.windowSpan > 0 ? props.windowSpan : Math.max(0, props.items.length - 1),
)

/** 由页面进度直接换算出的「前位」索引 —— 绝对值，不是增量 */
const windowIndex = computed(() => pageProgress.value * span.value)

/** 唯一的「前位」来源 */
const progress = computed(() =>
  props.driver === 'window' ? windowIndex.value : scrollTop.value / props.itemHeight,
)

const anchorPx = computed(() => ({
  x: props.anchorX * boxW.value,
  y: props.anchorY * boxH.value,
}))

/** 几何全部交给 composable —— 这里只管轨道 */
const arc = useFanArc({
  progress,
  itemHeight: () => props.itemHeight,
  radius: () => props.radius,
  maxAngle: () => props.maxAngle,
  orientation: () => props.orientation,
  anchorX: () => anchorPx.value.x,
  anchorY: () => anchorPx.value.y,
  fade: () => props.fade,
})

/**
 * 窗口模式下把轨道同步到前位：直接写绝对值（不是增量）。
 * useVirtualList 只认 container 的 scrollTop，同步过去它才取得到正确的窗口。
 * 依据 CSSWG css-overflow：overflow:hidden 的滚动容器「滚轮不滚、脚本可滚」。
 */
watchEffect(() => {
  if (props.driver !== 'window') return
  const el = scrollerRef.value
  if (!el) return
  const next = windowIndex.value * props.itemHeight
  if (Math.abs(el.scrollTop - next) > 0.5) el.scrollTop = next
})

/**
 * 容器 props。窗口模式下换成 overflow:hidden：
 * 它仍然是可以被脚本写 scrollTop 的滚动容器（"用户不可滚、脚本可滚"），
 * 所以页面滚动能独占这条轨道。
 *
 * 注意 overscroll-behavior 必须跟着一起放开：实测（Chrome）
 * 「overflow:hidden + overscroll-behavior:contain」会把滚轮整块吞掉 ——
 * 轨道不滚、页面也不滚，光标停在扇形上就彻底卡住。
 */
const scrollerProps = computed(() => {
  const { style, ...rest } = containerProps
  const base = (typeof style === 'object' && style !== null ? style : {}) as Record<string, unknown>
  const windowed = props.driver === 'window'
  return {
    ...rest,
    style: {
      ...base,
      overflowY: windowed ? 'hidden' : 'auto',
      overscrollBehavior: windowed ? 'auto' : 'contain',
    },
  }
})

/**
 * 轨道 scrollTop 的上限 = 总高 − 容器高，不补留白的话末尾
 * 「容器高 / itemHeight」条永远到不了前位。
 */
const endPadding = computed(() => {
  if (typeof props.endPadding === 'number') return Math.max(0, props.endPadding)
  if (props.endPadding === 'container') return boxH.value
  return props.driver === 'window' ? boxH.value : 0
})

/**
 * 把某一条滚到「前位」。
 * behavior='smooth' 时直接驱动轨道做平滑滚动 —— 因为 useVirtualList 的窗口
 * 跟着 scrollTop 走，平滑过程中的中间帧也会被正确取到，不会闪。
 */
function scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
  if (behavior === 'auto') {
    scrollTo(index)
    return
  }
  const el = scrollerRef.value
  if (!el) return
  el.scrollTo({ top: index * props.itemHeight, behavior })
}

defineExpose({
  scrollToIndex,
  scrollTo,
  progress,
  pageProgress,
  windowIndex,
  stepDeg: arc.stepDeg,
  scrollTop,
})
</script>

<template>
  <div ref="root" class="fan-list" :data-driver="driver">
    <div v-bind="scrollerProps" class="fan-list__scroller">
      <!-- 视觉层：sticky 钉在滚动视口上，条目用 transform 摆到弧上 -->
      <div class="fan-list__stage" :style="{ height: `${boxH}px` }">
        <div
          v-for="entry in list"
          :key="entry.index"
          class="fan-list__item"
          :style="arc.itemStyle(entry.index)"
        >
          <slot
            :item="entry.data"
            :index="entry.index"
            :active="Math.abs(progress - entry.index) < 0.5"
            :distance="arc.distanceOf(entry.index)"
          />
        </div>
      </div>
      <!-- 占位层：只负责撑出滚动高度（vueuse 自己维护 marginTop / height） -->
      <div v-bind="wrapperProps" />
      <!--
        末尾留白：让最后的条目也能滚到前位（见脚本里 endPadding 的注释）。
      -->
      <div
        v-if="endPadding > 0"
        class="fan-list__tail"
        :style="{ height: `${endPadding}px` }"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.fan-list {
  position: relative;
  width: 100%;
  height: 100%;
}

.fan-list__scroller {
  height: 100%;
  overflow-y: auto;
  // overscroll-behavior 交给 scrollerProps 内联控制（见脚本里的注释：window 模式必须放开）
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.fan-list__stage {
  position: sticky;
  top: 0;
  z-index: 1;
  // overflow:hidden 有两个作用：裁掉飞出去的条目，
  // 并阻止它们扩大滚动容器的 scrollable overflow（否则会滚不到头）
  overflow: hidden;
}

.fan-list__item {
  position: absolute;
  top: 0;
  left: 0;
  will-change: transform;
}

.fan-list__tail {
  pointer-events: none;
}
</style>
