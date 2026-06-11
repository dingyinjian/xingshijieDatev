<script setup lang="ts">
import * as echarts from 'echarts'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ModelPieItem } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{
    modelPie?: ModelPieItem[]
    modelCenterName?: string
    tokenMonths?: string[]
    tokenLastMonth?: number[]
    tokenThisMonth?: number[]
  }>(),
  {
    modelPie: () => [],
    modelCenterName: '',
    tokenMonths: () => [],
    tokenLastMonth: () => [],
    tokenThisMonth: () => [],
  },
)

const modelPieData = computed(() => props.modelPie)
const tokenMonths = computed(() => props.tokenMonths)
const tokenLastMonth = computed(() => props.tokenLastMonth)
const tokenThisMonth = computed(() => props.tokenThisMonth)

const pieRef = ref<HTMLDivElement | null>(null)
const barRef = ref<HTMLDivElement | null>(null)

let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let pieHighlightTimer: ReturnType<typeof setInterval> | null = null
let pieHighlightIndex = 0

const pieHighlightInterval = 2500

function getPieCenterContent(index: number) {
  const item = modelPieData.value[index] ?? modelPieData.value[0]
  if (!item) {
    return { value: '0家', name: '' }
  }
  return { value: `${item.value}家`, name: item.name }
}

function buildPieCenterTitle(value: string, name: string) {
  return {
    text: `{value|${value}}\n{name|${name}}`,
    left: '36%',
    top: '50%',
    textAlign: 'center' as const,
    textVerticalAlign: 'middle' as const,
    textStyle: {
      fontFamily: 'Alibaba-PuHuiTi, sans-serif',
      rich: {
        value: {
          fontSize: 20,
          fontWeight: 700,
          color: '#ffffff',
          lineHeight: 26,
          align: 'center' as const,
        },
        name: {
          fontSize: 12,
          color: '#b5c9e3',
          lineHeight: 18,
          align: 'center' as const,
        },
      },
    },
  }
}

function buildPieOption(): echarts.EChartsOption {
  // const { value: centerValue, name: centerName } = getPieCenterContent(pieHighlightIndex)
  return {
    animation: true,
    tooltip: { show: false },
    legend: {
      orient: 'vertical',
      right: '15%',
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      icon: 'circle',
      textStyle: {
        color: '#b5c9e3',
        fontSize: 14,
        fontFamily: 'Alibaba-PuHuiTi, sans-serif',
      },
    },
    series: [
      {
        type: 'pie',
        center: ['37%', '50%'],
        radius: ['38%', '70%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        emphasis: {
          focus: 'self',
          scale: true,
          scaleSize: 10,
          itemStyle: {
            shadowBlur: 14,
            shadowColor: 'rgba(0, 200, 255, 0.5)',
          },
        },
        blur: {
          itemStyle: { opacity: 0.45 },
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: 'rgba(0, 20, 50, 0.6)',
        },
        data: modelPieData.value.map((d) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color },
        })),
      },
    ],
    // title: {left: '25%',top: '48%',text: buildPieCenterTitle(centerValue, centerName).text},
  }
}

function buildBarOption(): echarts.EChartsOption {
  return {
    animation: true,
    tooltip: { show: false },
    legend: { show: false },
    grid: {
      left: '14%',
      right: '6%',
      top: '10%',
      bottom: '12%',
      containLabel: false,
    },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      inverse: true,
      data: tokenMonths.value,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: '#9eb8d8',
        fontSize: 11,
        fontFamily: 'Alibaba-PuHuiTi, sans-serif',
        margin: 8,
      },
    },
    series: [
      {
        name: '上月数据',
        type: 'bar',
        stack: 'token',
        barWidth: 12,
        barCategoryGap: '8%',
        data: tokenLastMonth.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#3062FF' },
            { offset: 1, color: '#00C7FF' },
          ]),
          borderRadius: [0, 0, 0, 0],
        },
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Alibaba-PuHuiTi, sans-serif',
          formatter: '{c}',
        },
      },
      {
        name: '本月新增',
        type: 'bar',
        stack: 'token',
        barWidth: 9,
        data: tokenThisMonth.value,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#05A998' },
            { offset: 1, color: '#62FAFB' },
          ]),
          borderRadius: [0, 2, 2, 0],
        },
        label: {
          show: true,
          position: 'inside',
          color: '#ffffff',
          fontSize: 10,
          fontFamily: 'Alibaba-PuHuiTi, sans-serif',
          formatter: '{c}',
        },
      },
    ],
  }
}

function resizeCharts() {
  pieChart?.resize()
  barChart?.resize()
}

function updatePieCenter(index: number) {
  if (!pieChart) return
  const { value, name } = getPieCenterContent(index)
  pieChart.setOption({
    title: buildPieCenterTitle(value, name),
  })
}

function highlightPieSlice(index: number) {
  if (!pieChart || !modelPieData.value.length) return
  pieHighlightIndex = index
  pieChart.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  pieChart.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: index,
  })
  updatePieCenter(index)
}

function startPieAutoHighlight() {
  stopPieAutoHighlight()
  if (!pieChart || !modelPieData.value.length) return
  pieHighlightIndex = 0
  highlightPieSlice(pieHighlightIndex)
  pieHighlightTimer = setInterval(() => {
    pieHighlightIndex = (pieHighlightIndex + 1) % modelPieData.value.length
    highlightPieSlice(pieHighlightIndex)
  }, pieHighlightInterval)
}

function stopPieAutoHighlight() {
  if (pieHighlightTimer != null) {
    clearInterval(pieHighlightTimer)
    pieHighlightTimer = null
  }
  pieChart?.dispatchAction({ type: 'downplay', seriesIndex: 0 })
}

function refreshCharts() {
  if (pieChart) {
    pieChart.setOption(buildPieOption(), true)
    startPieAutoHighlight()
  }
  if (barChart) {
    barChart.setOption(buildBarOption(), true)
  }
}

function initCharts() {
  if (pieRef.value && !pieChart) {
    pieChart = echarts.init(pieRef.value)
  }
  if (barRef.value && !barChart) {
    barChart = echarts.init(barRef.value)
  }
  refreshCharts()
}

onMounted(() => {
  initCharts()
  resizeObserver = new ResizeObserver(() => resizeCharts())
  if (pieRef.value) resizeObserver.observe(pieRef.value)
  if (barRef.value) resizeObserver.observe(barRef.value)
  window.addEventListener('resize', resizeCharts)
})

watch(
  () => [props.modelPie, props.tokenMonths, props.tokenLastMonth, props.tokenThisMonth],
  () => refreshCharts(),
  { deep: true },
)

onBeforeUnmount(() => {
  stopPieAutoHighlight()
  window.removeEventListener('resize', resizeCharts)
  resizeObserver?.disconnect()
  pieChart?.dispose()
  barChart?.dispose()
  pieChart = null
  barChart = null
})
</script>

<template>
  <div class="model-usage">
    <div ref="pieRef" class="model-usage-pie" />
    <div class="model-usage-token">
      <div class="model-usage-token-header">
        <div class="model-usage-token-title">Token使用情况（单位:万）</div>
        <div class="model-usage-token-legend">
          <span class="model-usage-token-legend-item">
            <i class="legend-icon legend-icon--last" />
            上月数据
          </span>
          <span class="model-usage-token-legend-item">
            <i class="legend-icon legend-icon--new" />
            本月新增
          </span>
        </div>
      </div>
      <div ref="barRef" class="model-usage-bar" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;
$design-height: 1080;

.model-usage {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: calc(2 / #{$design-height} * 100vh) calc(8 / #{$design-width} * 100vw)
    calc(4 / #{$design-height} * 100vh);
  box-sizing: border-box;
  gap: calc(6 / #{$design-height} * 100vh);
}

.model-usage-pie {
  flex: 1.1;
  min-height: 0;
  width: 100%;
}

.model-usage-token {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.model-usage-token-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(4 / #{$design-width} * 100vw);
  margin-bottom: calc(4 / #{$design-height} * 100vh);
}

.model-usage-token-title {
  font-size: calc(12 / #{$design-width} * 100vw);
  color: #9eb8d8;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.model-usage-token-legend {
  display: flex;
  gap: calc(12 / #{$design-width} * 100vw);
  font-size: calc(11 / #{$design-width} * 100vw);
  color: #9eb8d8;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.model-usage-token-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-icon {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-icon--last {
  background: linear-gradient(90deg, #3062ff, #00c7ff);
}

.legend-icon--new {
  background: linear-gradient(90deg, #05a998, #62fafb);
}

.model-usage-bar {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>
