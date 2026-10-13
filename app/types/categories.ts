export interface Categories {
  label: string
  percentage: number
  color: string
  value: number
}

/** 图表数据集项：`vue-data-ui` 的 dataset 形状（`VueUiSparkStackbar` 等直接消费） */
export interface ChartDatum {
  name: string
  value: number
  color?: string
}
