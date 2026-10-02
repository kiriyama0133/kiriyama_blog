import { computed, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'

/**
 * 扇形几何 —— 只做数学，不碰 DOM、不知道虚拟列表、也不关心谁在驱动滚动。
 *
 * 这是把「扇形」从「虚拟列表」里拆出来的那一步：
 *   FanVirtualList = 滚动轨道(useVirtualList) + 本文件的几何
 * 所以任何容器（虚拟或不虚拟）都能直接复用它来摆一条弧。
 */
export type FanOrientation = 'upright' | 'tangent' | 'radial'

export interface FanArcOptions {
  /** 当前落在「前位」上的浮点索引 = 轨道位置 / itemHeight */
  progress: MaybeRefOrGetter<number>
  /** 每条在轨道上占的高度(px)：和 radius 一起决定角度步进 */
  itemHeight: MaybeRefOrGetter<number>
  /** 圆心到「前位」的距离(px)：越小弧越弯 */
  radius: MaybeRefOrGetter<number>
  /** 超过这个偏角(deg)就不显示 */
  maxAngle: MaybeRefOrGetter<number>
  orientation: MaybeRefOrGetter<FanOrientation>
  /** 「前位」在容器里的锚点坐标(px，不是比例) */
  anchorX: MaybeRefOrGetter<number>
  anchorY: MaybeRefOrGetter<number>
  /** 远离前位时的淡出强度，0 = 不淡出 */
  fade: MaybeRefOrGetter<number>
}

export interface FanArcPosition {
  /** 条目中心在容器里的坐标(px) */
  x: number
  y: number
  /** 条目自身旋转角(deg) */
  rot: number
  /** 相对前位的偏角（弧度 / 角度） */
  theta: number
  thetaDeg: number
  /** 是否落在 maxAngle 之内 */
  visible: boolean
  /** 0 = 正好在前位，1 = 刚好到 maxAngle */
  distance: number
}

export function useFanArc(options: FanArcOptions) {
  /** 每条跨越的圆心角（弧度）—— 「固定角度」就来自这里 */
  const stepRad = computed(() => toValue(options.itemHeight) / toValue(options.radius))
  const stepDeg = computed(() => (stepRad.value * 180) / Math.PI)
  const maxAngleRad = computed(() => (toValue(options.maxAngle) * Math.PI) / 180)

  /** 相对「前位」的偏角：索引大于前位 → 往下走（负角） */
  function angleOf(index: number) {
    return (toValue(options.progress) - index) * stepRad.value
  }

  function distanceOf(index: number) {
    const max = maxAngleRad.value
    if (max <= 0) return 1
    return Math.min(1, Math.abs(angleOf(index)) / max)
  }

  function positionOf(index: number): FanArcPosition {
    const theta = angleOf(index)
    const r = toValue(options.radius)
    // 圆心在「锚点向右 r」处：theta = 0 时条目正好落在锚点，向两端张开并轻微右凸
    const x = toValue(options.anchorX) + r * (1 - Math.cos(theta))
    const y = toValue(options.anchorY) - r * Math.sin(theta)
    const thetaDeg = (theta * 180) / Math.PI
    const orientation = toValue(options.orientation)
    const rot =
      orientation === 'upright' ? 0 : orientation === 'radial' ? thetaDeg - 90 : thetaDeg
    return {
      x,
      y,
      rot,
      theta,
      thetaDeg,
      visible: Math.abs(theta) <= maxAngleRad.value,
      distance: distanceOf(index),
    }
  }

  /** 直接能挂到 style 上的 transform（配合 CSS 里的 left/top:0 + translate(-50%,-50%)） */
  function transformOf(index: number) {
    const { x, y, rot } = positionOf(index)
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg)`
  }

  function itemStyle(index: number) {
    const pos = positionOf(index)
    if (!pos.visible) return { display: 'none' as const }
    return {
      transform: transformOf(index),
      opacity: String(1 - toValue(options.fade) * pos.distance),
      zIndex: String(1000 - Math.round(Math.abs(pos.thetaDeg))),
    }
  }

  return { stepRad, stepDeg, maxAngleRad, angleOf, distanceOf, positionOf, transformOf, itemStyle }
}
