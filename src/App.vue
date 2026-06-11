<script setup lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FlipCounter from './components/FlipCounter.vue'
import CenterStatsPanel from './components/CenterStatsPanel.vue'
import IndustryInnovationPanel from './components/IndustryInnovationPanel.vue'
import ModelUsagePanel from './components/ModelUsagePanel.vue'
import { useDashboard } from '@/composables/useDashboard'
import { useHikvisionVisitor } from '@/composables/useHikvisionVisitor'
import type { EnterpriseItem, LeftItem2Stat, RightItem2Stat } from '@/types/dashboard'
import {
  buildFallbackCenterMarks,
  mergeBuildingMarks,
  type CenterMarkItem,
} from '@/constants/buildingLayouts'
import dialogBg from '@/assets/dialog1.svg?url'

type LeftItem1Row = EnterpriseItem

const { data: dashboardData } = useDashboard()
const { enabled: hikvisionEnabled, count: hikvisionCount, connected: hikvisionConnected } =
  useHikvisionVisitor()

const contentLeftItem1Data = computed<LeftItem1Row[]>(() => dashboardData.value.enterprise)
const activeMarkName = ref<string | null>('7号楼')

const centerMarkData = computed<CenterMarkItem[]>(() => {
  const apiList = dashboardData.value.building
  if (apiList.length > 0) {
    const merged = mergeBuildingMarks(apiList)
    if (merged.length > 0) return merged
  }
  return buildFallbackCenterMarks()
})

const activeMark = computed(() =>
  centerMarkData.value.find((m) => m.name === activeMarkName.value) ?? null,
)

function markDialogStyle(item: CenterMarkItem) {
  return {
    left: item.dialogX ?? item.x,
    top: item.dialogY ?? item.y,
  }
}

function onMarkClick(item: CenterMarkItem) {
  activeMarkName.value = activeMarkName.value === item.name ? null : item.name
}

function closeMarkDialog() {
  activeMarkName.value = null
}

/** 右侧列表展示顺序（与设计稿一致） */
const item1ListOrder = ['动画/漫剧', '微短剧', '直播', '短视频/协拍', '创意设计', '其他']
const contentLeftItem1List = computed(() => {
  const list = contentLeftItem1Data.value
  const ordered = item1ListOrder
    .map((name) => list.find((d) => d.name === name))
    .filter((d): d is LeftItem1Row => !!d)
  const rest = list.filter((d) => !item1ListOrder.includes(d.name))
  return [...ordered, ...rest]
})

const item1ArcLayouts = computed(() =>
  contentLeftItem1Data.value.map((item, i) => {
    const r = item1ArcR(i)
    const len = arcLen(r)
    return { ...arcRingStroke(r, item.percentage), r, len }
  }),
)

const item1ArcCx = 118
const item1ArcCy = 102
const item1ArcBaseR = 98
const item1ArcStep = 16

/** 圆环总弧度 80%（288°），缺口 20%（72°）在右上角 */
const item1ArcSpanDeg = 288
const item1ArcStartDeg = 351 // 315° + 36°
const item1ArcEndDeg = 279 // 315° - 36°

function item1ArcR(index: number) {
  return item1ArcBaseR - index * item1ArcStep
}

function arcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPathD(cx: number, cy: number, r: number) {
  // 从缺口起点(279°)逆时针画至 351°，高亮从路径起点(279°)起
  const start = arcPoint(cx, cy, r, item1ArcEndDeg)
  const end = arcPoint(cx, cy, r, item1ArcStartDeg)
  return `M ${start.x} ${start.y} A ${r} ${r} 0 1 0 ${end.x} ${end.y}`
}

/** 高亮弧角度范围：按占比单调映射，占比越小弧越短、越大越长 */
const item1HighlightSpanMinDeg = 140
const item1HighlightSpanMaxDeg = 272

function item1HighlightSpanDeg(percentage: number) {
  const pct = Math.min(100, Math.max(0, percentage))
  const span =
    item1HighlightSpanMinDeg +
    (pct / 100) * (item1HighlightSpanMaxDeg - item1HighlightSpanMinDeg)
  return Math.min(span, item1ArcSpanDeg)
}

function arcLen(r: number) {
  return (item1ArcSpanDeg / 360) * 2 * Math.PI * r
}

/** 高亮弧从缺口起点(279°)起，长度随占比单调递增 */
function arcRingStroke(r: number, percentage: number) {
  const len = arcLen(r)
  const spanDeg = item1HighlightSpanDeg(percentage)
  const dashLen = (spanDeg / item1ArcSpanDeg) * len

  return {
    dasharray: `${dashLen} ${len - dashLen}`,
    dashoffset: 0,
    dashLen,
  }
}

/** 企业概览环形图：当前轮播高亮的圈索引 */
const item1ActiveArcIndex = ref(0)
let item1ArcRotateTimer: ReturnType<typeof setInterval> | null = null
const item1ArcRotateInterval = 2800

const item1ActiveEnterprise = computed(
  () => contentLeftItem1Data.value[item1ActiveArcIndex.value] ?? null,
)

function startItem1ArcRotate() {
  stopItem1ArcRotate()
  const count = contentLeftItem1Data.value.length
  if (count <= 1) {
    item1ActiveArcIndex.value = 0
    return
  }
  item1ArcRotateTimer = setInterval(() => {
    item1ActiveArcIndex.value = (item1ActiveArcIndex.value + 1) % count
  }, item1ArcRotateInterval)
}

function stopItem1ArcRotate() {
  if (item1ArcRotateTimer != null) {
    clearInterval(item1ArcRotateTimer)
    item1ArcRotateTimer = null
  }
}

onMounted(() => {
  startItem1ArcRotate()
})

watch(
  () => contentLeftItem1Data.value.length,
  () => {
    item1ActiveArcIndex.value = 0
    startItem1ArcRotate()
  },
)

onBeforeUnmount(() => {
  stopItem1ArcRotate()
})

/** 百分比标签：各圈弧起点(279°)右侧，右对齐成列 */
function item1PctLabelX(cx: number, cy: number) {
  const p = arcPoint(cx, cy, item1ArcBaseR, item1ArcEndDeg)
  return p.x + 10
}

function pctLabelPos(cx: number, cy: number, r: number) {
  const p = arcPoint(cx, cy, r, item1ArcEndDeg)
  return { x: item1PctLabelX(cx, cy), y: p.y + 4 }
}

const contentLeftItem2Rows = computed<LeftItem2Stat[][]>(() => dashboardData.value.workOutputRows)

const contentRightItem2Data = computed<RightItem2Stat[]>(() => dashboardData.value.operation)

/** 实时参观人数（优先海康摄像头进入人数，否则回退后端接口） */
const visitCount = ref(0)

watch(
  [() => hikvisionCount.value.enter, () => dashboardData.value.visitCount, () => hikvisionConnected.value],
  () => {
    const useCamera = hikvisionEnabled && hikvisionConnected.value
    visitCount.value = useCamera ? hikvisionCount.value.enter : dashboardData.value.visitCount
  },
  { immediate: true },
)
</script>

<template>
  <!-- <HelloWorld /> -->
  <div id="datav-app" @click="closeMarkDialog">
    <div class="datav-app-header">
      <div class="datav-app-header-title">
        <span class="title-text">星视界OPC社区管理平台</span>
        <!-- <span class="title-shine" aria-hidden="true">星视界OPC社区管理平台</span> -->
      </div>
    </div>
    <div class="datav-app-content">
      <div class="datav-app-content-left">
        <div class="datav-app-content-left-item1">
          <div class="datav-app-content-left-item-title">企业概览</div>
          <div class="datav-app-content-left-item1-content">
            <div class="item1-legends">
              <div
                v-for="(item, i) in contentLeftItem1Data"
                :key="'lg-' + item.name"
                class="item1-legend"
                :class="{ 'is-active': item1ActiveArcIndex === i }"
              >
                <span class="item1-legend-dot" :style="{ backgroundColor: item.color }" />
                <span class="item1-legend-name">{{ item.name }}</span>
              </div>
            </div>
            <div class="item1-main">
              <div class="item1-chart">
                <svg class="item1-svg" viewBox="0 0 236 200" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                  <g
                    v-for="(item, i) in contentLeftItem1Data"
                    :key="'arc-' + item.name"
                    class="item1-arc-group"
                    :class="{ 'is-active': item1ActiveArcIndex === i }"
                  >
                    <path
                      :d="arcPathD(item1ArcCx, item1ArcCy, item1ArcLayouts[i].r)"
                      fill="none"
                      stroke="#002B8F"
                      stroke-width="10"
                      stroke-opacity="0.6"
                      stroke-linecap="round"
                    />
                    <path
                      class="item1-arc-highlight"
                      :d="arcPathD(item1ArcCx, item1ArcCy, item1ArcLayouts[i].r)"
                      fill="none"
                      :stroke="item.color"
                      stroke-linecap="round"
                      :stroke-dasharray="item1ArcLayouts[i].dasharray"
                      :stroke-dashoffset="item1ArcLayouts[i].dashoffset"
                    />
                    <text class="item1-pct" :x="pctLabelPos(item1ArcCx, item1ArcCy, item1ArcLayouts[i].r).x"
                      :y="pctLabelPos(item1ArcCx, item1ArcCy, item1ArcLayouts[i].r).y" fill="#9eb8d8"
                      text-anchor="start" dominant-baseline="middle">
                      {{ item.percentage }}%
                    </text>
                  </g>
                </svg>
              </div>
              <ul class="item1-list">
                <li
                  v-for="item in contentLeftItem1List"
                  :key="'row-' + item.name"
                  class="item1-list-row"
                  :class="{ 'is-active': item1ActiveEnterprise?.name === item.name }"
                >
                  <span class="item1-list-dot" :style="{ backgroundColor: item.color }" />
                  <span class="item1-list-name">{{ item.name }}</span>
                  <span class="item1-list-val" :style="{ color: item.color }">{{ item.value }}家</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="datav-app-content-left-item2">
          <div class="datav-app-content-left-item-title">作品产出及人才聚集</div>
          <div class="datav-app-content-left-item2-content">
            <div class="item2-rows">
              <div v-for="(row, rowIndex) in contentLeftItem2Rows" :key="'item2-row-' + rowIndex" class="item2-stats"
                :class="row.length === 2 ? 'item2-stats--cols-2' : 'item2-stats--cols-3'">
                <div v-for="(stat, i) in row" :key="'item2-' + rowIndex + '-' + i" class="item2-stat">
                  <div class="item2-stat-value">
                    <span class="item2-stat-num">
                      <span class="item2-stat-num-text">{{ stat.value }}</span>
                      <span class="item2-stat-num-shine" aria-hidden="true">{{ stat.value }}</span>
                    </span>
                    <span class="item2-stat-unit">{{ stat.unit }}</span>
                  </div>
                  <p class="item2-stat-label">{{ stat.label }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="datav-app-content-left-item3">
          <div class="datav-app-content-left-item-title">实时参观人数</div>
          <div class="datav-app-content-left-item3-content">
            <FlipCounter :value="visitCount" :digits="6" />
          </div>
        </div>
      </div>
      <div class="datav-app-content-center">
        <CenterStatsPanel
          :park-stat="dashboardData.parkStat"
          :orders="dashboardData.orders"
        />
      </div>
      <div class="datav-app-content-right">
        <div class="datav-app-content-right-item1">
          <div class="datav-app-content-left-item-title">模型使用情况</div>
          <div class="datav-app-content-right-item1-content">
            <ModelUsagePanel
              :model-pie="dashboardData.modelUsage.pie"
              :model-center-name="dashboardData.modelUsage.centerName"
              :token-months="dashboardData.tokenUsage.months"
              :token-last-month="dashboardData.tokenUsage.lastMonth"
              :token-this-month="dashboardData.tokenUsage.thisMonth"
            />
          </div>
        </div>
        <div class="datav-app-content-right-item2">
          <div class="datav-app-content-left-item-title">运营与公共服务</div>
          <div class="datav-app-content-right-item2-content">
            <div class="item2r-stats">
              <div v-for="(stat, i) in contentRightItem2Data" :key="'item2r-' + i" class="item2r-stat">
                <div class="item2r-stat-icon-wrap">
                  <span class="item2r-stat-num">
                    <span class="item2r-stat-num-text">{{ stat.value }}</span>
                    <span class="item2r-stat-num-shine" aria-hidden="true">{{ stat.value }}</span>
                  </span>
                </div>
                <p class="item2r-stat-label">
                  <span>{{ stat.labelLine1 }}</span>
                  <span>{{ stat.labelLine2 }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="datav-app-content-right-item3">
          <div class="datav-app-content-left-item-title">产业协调与创新</div>
          <div class="datav-app-content-right-item3-content">
            <IndustryInnovationPanel :industry="dashboardData.industry" />
          </div>
        </div>
      </div>
    </div>
    <div v-for="item in centerMarkData" :key="item.name" class="datav-app-mark"
      :class="{ 'is-active': activeMarkName === item.name }"
      :style="{ left: item.x, top: item.y, zIndex: activeMarkName === item.name ? 100 : 10 }"
      @click.stop="onMarkClick(item)">
      <div class="datav-app-mark-number" :style="{
        width: item.width,
        height: item.height,
        fontSize: item.fontSize,
        color: item.color,
        gap: item.gap,
        backgroundImage: item.backgroundImage,
        backgroundSize: item.backgroundSize,
        backgroundPosition: item.backgroundPosition,
      }">
        <img :src="item.image" :alt="item.name" />
        <span class="datav-app-mark-number-text">{{ item.name }}</span>
      </div>
      <img class="datav-app-mark-location" :src="item.location" :alt="item.name" />
    </div>
    <div v-if="activeMark" class="datav-app-mark-dialog" :style="markDialogStyle(activeMark)" @click.stop>
      <div class="datav-app-mark-dialog__panel">
        <img class="datav-app-mark-dialog__bg" :src="dialogBg" alt="" aria-hidden="true" />
        <div class="datav-app-mark-dialog__title"></div>
        <div class="datav-app-mark-dialog__body" style="display: flex;align-items: center;gap: 10px;">
          <div style="height: 100%;background: #ffffff;width: 22%;"></div>
          <div style="width: 78%;">
          <div class="datav-app-mark-dialog__row" style="display: flex; align-items: center;gap: 10px;color: #ffffff;justify-content: flex-start;">
            <div><img src="@/assets/sanjiao.svg" alt="" srcset=""></div>
            <div>
              <span class="datav-app-mark-dialog__label" style="font-size: 16px;color: #ffffff;">楼栋：</span>
              <span class="datav-app-mark-dialog__value">{{ activeMark.name }}</span>
            </div>
          </div>
          <div style="height: 1px;background: #ffffff;width: 90%;margin: 0 auto;"></div>
          <div class="datav-app-mark-dialog__row2-divider" style="color: #ffffff;line-height: 1.5;text-align: left;margin-left: 20px;">
            <div >
              <span class="datav-app-mark-dialog__label" style="color: #ffffff;">产业定位：</span>
              <span class="datav-app-mark-dialog__value">{{ activeMark.industryPosition }}</span>
            </div>
            <div >
              <span class="datav-app-mark-dialog__label" style="color: #ffffff;">入驻企业总数：</span>
              <span class="datav-app-mark-dialog__value">{{ activeMark.companyNumber }}家</span>
            </div>
          </div>
         </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
// 设计稿 1920 × 1080（65 寸屏同为该分辨率，全屏时 vw/vh 计算值 = 设计稿 px）
$design-width: 1920;
$design-height: 1080;
$header-height: 120;
$footer-height: 72;
$content-side-width: 422;
$content-padding: 15;
// 左侧三块面板（422 宽）
$left-item1-h: 372;
$left-item2-h: 310;
$left-item3-h: 192;
// 右侧三块面板（422 宽）
$right-item1-h: 395;
$right-item2-h: 240;
$right-item3-h: 240;
$content-title-height: 40;

#datav-app {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  background-image: url('@/assets/appbg2.gif');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;

  .datav-app-header {
    width: 100%;
    flex-shrink: 0;
    // 100px / 1080px，在 1080p 屏上恰好 100px，大屏等比放大
    height: calc(#{$header-height} / #{$design-height} * 100vh);
    // background-image: url('@/assets/header-bg.png');
    background-size: 100% 100%;
    background-position: center top;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;

    .datav-app-header-title {
      position: relative;
      display: inline-block;
      font-family: 'Alibaba-PuHuiTi', sans-serif;
      font-weight: 700;
      font-size: calc(42 / #{$design-width} * 100vw);
      line-height: 1;
      letter-spacing: 2px;
      text-align: center;
      font-style: normal;
      white-space: nowrap;
      filter: drop-shadow(0 2px 8px rgba(0, 21, 62, 0.6)) drop-shadow(0 0 14px rgba(0, 160, 255, 0.35)) drop-shadow(0 0 28px rgba(0, 100, 220, 0.18));

      // 标题背后：双层蓝光晕
      &::before {
        content: '';
        position: absolute;
        left: 50%;
        top: 55%;
        transform: translate(-50%, -50%);
        width: 140%;
        height: 240%;
        background:
          radial-gradient(ellipse at center,
            rgba(0, 220, 255, 0.18) 0%,
            transparent 48%),
          radial-gradient(ellipse at center,
            rgba(0, 136, 255, 0.28) 0%,
            rgba(0, 80, 200, 0.08) 42%,
            transparent 72%);
        pointer-events: none;
        z-index: -1;
      }

      // 底部蓝色倒影
      &::after {
        content: '';
        position: absolute;
        left: 10%;
        right: 10%;
        bottom: -16%;
        height: 32%;
        background: linear-gradient(to bottom,
            rgba(0, 180, 255, 0.2) 0%,
            rgba(0, 100, 200, 0.06) 60%,
            transparent 100%);
        transform: perspective(120px) rotateX(75deg) scaleY(0.35);
        filter: blur(4px);
        opacity: 0.75;
        pointer-events: none;
      }

      // 底层：纯白实心字
      .title-text {
        position: relative;
        z-index: 1;
        display: inline-block;
        color: #ffffff;
        -webkit-text-stroke: 0.55px rgba(0, 180, 255, 0.55);
        paint-order: stroke fill;
        text-shadow:
          0 1px 2px rgba(0, 15, 40, 0.65),
          0 3px 10px rgba(0, 0, 0, 0.4),
          0 0 14px rgba(0, 136, 255, 0.22);
      }

      // 扫光：青蓝晕 + 白芯 + 外发光
      .title-shine {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        color: transparent;
        background: linear-gradient(110deg,
            transparent 0%,
            transparent 38%,
            rgba(0, 80, 220, 0.25) 43%,
            rgba(0, 200, 255, 0.65) 47%,
            rgba(160, 230, 255, 0.95) 49%,
            #ffffff 50%,
            rgba(160, 230, 255, 0.95) 51%,
            rgba(0, 200, 255, 0.65) 53%,
            rgba(0, 80, 220, 0.25) 57%,
            transparent 62%,
            transparent 100%);
        background-size: 220% 100%;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 6px rgba(0, 200, 255, 0.55)) drop-shadow(0 0 14px rgba(0, 136, 255, 0.35));
        animation: title-light-flow 6s linear infinite;
      }
    }
  }

  .datav-app-content {
    width: 100%;
    // 剩余高度 = 设计稿内容区 980px (1080 - 100)
    flex: 1;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: calc(#{$content-padding} / #{$design-width} * 100vw);

    .datav-app-content-left-item-title {
      height: calc(#{$content-title-height} / #{$design-height} * 100vh);
      // line-height: calc(#{$content-title-height} / #{$design-height} * 100vh);
      display: flex;
      align-items: center;
      text-align: left;
      font-family: 'Alibaba-PuHuiTi', sans-serif;
      font-weight: 700;
      font-size: calc(18 / #{$design-width} * 100vw);
      color: #ffffff;
      padding: 0 20px;
    }

    // 左侧：1920×1080 下宽 422px，三块高 372 / 310 / 192px
    .datav-app-content-left {
      flex-shrink: 0;
      width: calc(#{$content-side-width} / #{$design-width} * 100vw);
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: calc(#{$content-padding} / #{$design-height} * 100vh);
      box-sizing: border-box;

      %left-panel-item {
        flex-shrink: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
        overflow: hidden;
      }

      .datav-app-content-left-item1 {
        @extend %left-panel-item;
        height: calc(#{$left-item1-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/left-item1.png');
      }

      .datav-app-content-left-item1-content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        padding: calc(4 / #{$design-height} * 100vh) calc(12 / #{$design-width} * 100vw) calc(10 / #{$design-height} * 100vh);
        box-sizing: border-box;
        gap: calc(6 / #{$design-height} * 100vh);

        .item1-legends {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          column-gap: calc(10 / #{$design-width} * 100vw);
          row-gap: calc(3 / #{$design-height} * 100vh);
        }

        .item1-legend {
          display: inline-flex;
          align-items: center;
          gap: calc(4 / #{$design-width} * 100vw);
          opacity: 0.55;
          transition: opacity 0.45s ease;

          &.is-active {
            opacity: 1;

            .item1-legend-name {
              color: #ffffff;
              font-weight: 600;
            }
          }
        }

        .item1-legend-dot {
          width: calc(6 / #{$design-width} * 100vw);
          height: calc(6 / #{$design-width} * 100vw);
          min-width: 5px;
          min-height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .item1-legend-name {
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(14 / #{$design-width} * 100vw);
          color: #b5c9e3;
          white-space: nowrap;
        }

        .item1-main {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: calc(6 / #{$design-width} * 100vw);
        }

        .item1-chart {
          flex: 1.15;
          min-width: 64%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item1-svg {
          width: 100%;
          height: 100%;
          min-height: calc(185 / #{$design-height} * 100vh);
          overflow: visible;
        }

        .item1-arc-group {
          .item1-arc-highlight {
            stroke-width: 8;
            opacity: 0.32;
            transition: opacity 0.45s ease, stroke-width 0.45s ease;
          }

          .item1-pct {
            fill: #6a8aaa;
            transition: fill 0.45s ease;
          }

          &.is-active {
            .item1-arc-highlight {
              stroke-width: 10;
              opacity: 1;
            }

            .item1-pct {
              fill: #ffffff;
              font-weight: 700;
            }
          }
        }

        .item1-pct {
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(10 / #{$design-width} * 100vw);
        }

        .item1-list {
          flex: 0 0 42%;
          max-width: 34%;
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .item1-list-row {
          display: flex;
          align-items: center;
          gap: calc(6 / #{$design-width} * 100vw);
          padding: calc(5 / #{$design-height} * 100vh) 0;
          border-bottom: 1px solid rgba(28, 72, 120, 0.4);
          opacity: 0.6;
          transition: opacity 0.45s ease;

          &.is-active {
            opacity: 1;

            .item1-list-name {
              color: #ffffff;
            }
          }

          &:last-child {
            border-bottom: none;
          }
        }

        .item1-list-dot {
          width: calc(6 / #{$design-width} * 100vw);
          height: calc(6 / #{$design-width} * 100vw);
          min-width: 5px;
          min-height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .item1-list-name {
          flex: 1;
          min-width: 0;
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(14 / #{$design-width} * 100vw);
          color: #c5d5ea;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          white-space: nowrap;
        }

        .item1-list-val {
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-weight: 700;
          font-size: calc(13 / #{$design-width} * 100vw);
          flex-shrink: 0;
        }
      }

      .datav-app-content-left-item2 {
        @extend %left-panel-item;
        height: calc(#{$left-item2-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/left-item2.png');
      }

      .datav-app-content-left-item2-content {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: calc(4 / #{$design-height} * 100vh) calc(20 / #{$design-width} * 100vw) calc(10 / #{$design-height} * 100vh);
        box-sizing: border-box;

        .item2-rows {
          display: flex;
          flex-direction: column;
          gap: calc(10 / #{$design-height} * 100vh);
          width: 100%;
        }

        .item2-stats {
          width: 100%;
          height: calc(112 / #{$design-height} * 100vh);
          flex-shrink: 0;
          display: flex;
          align-items: stretch;
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
        }

        .item2-stats--cols-3 {
          background-image: url('@/assets/left2-itembg.png');
        }

        .item2-stats--cols-2 {
          background-image: url('@/assets/left2-itembg2.png');
        }

        .item2-stat {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: calc(8 / #{$design-height} * 100vh) calc(4 / #{$design-width} * 100vw);
          box-sizing: border-box;
        }

        .item2-stat-value {
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: calc(2 / #{$design-width} * 100vw);
        }

        .item2-stat-num {
          position: relative;
          display: inline-block;
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-weight: 700;
          font-size: calc(40 / #{$design-width} * 100vw);
          line-height: 1;
          letter-spacing: calc(1 / #{$design-width} * 100vw);
        }

        .item2-stat-num-text {
          display: inline-block;
          background: linear-gradient(180deg, #ffffff 0%, #8ecaff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .item2-stat-num-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          color: transparent;
          background: linear-gradient(110deg,
              transparent 0%,
              transparent 38%,
              rgba(0, 80, 220, 0.2) 43%,
              rgba(0, 200, 255, 0.55) 47%,
              rgba(160, 230, 255, 0.9) 49%,
              #ffffff 50%,
              rgba(160, 230, 255, 0.9) 51%,
              rgba(0, 200, 255, 0.55) 53%,
              rgba(0, 80, 220, 0.2) 57%,
              transparent 62%,
              transparent 100%);
          background-size: 220% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 4px rgba(0, 200, 255, 0.45));
          animation: title-light-flow 5s linear infinite;
        }

        .item2-stat-unit {
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(14 / #{$design-width} * 100vw);
          color: #7eb8ff;
          line-height: 1;
          flex-shrink: 0;
        }

        .item2-stat-label {
          margin: calc(10 / #{$design-height} * 100vh) 0 0;
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(14 / #{$design-width} * 100vw);
          color: #ffffff;
          line-height: 1.3;
          text-align: center;
          white-space: nowrap;
        }
      }

      .datav-app-content-left-item3 {
        @extend %left-panel-item;
        height: calc(#{$left-item3-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/left-item3.png');
      }

      .datav-app-content-left-item3-content {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: calc(4 / #{$design-height} * 100vh) calc(12 / #{$design-width} * 100vw) calc(8 / #{$design-height} * 100vh);
        box-sizing: border-box;
      }

      [class$='-title'] {
        flex-shrink: 0;
        font-family: 'Alibaba-PuHuiTi', sans-serif;
        font-weight: 700;
        font-size: calc(18 / #{$design-width} * 100vw);
        color: #ffffff;
      }

      [class$='-content'] {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
    }

    .datav-app-content-center {
      flex: 1;
      min-width: 0;
      height: calc(100% - 60px);
      min-height: 0;
      overflow: hidden;
    }

    .datav-app-content-right {
      flex-shrink: 0;
      width: calc(#{$content-side-width} / #{$design-width} * 100vw);
      height: 100%;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: calc(#{$content-padding} / #{$design-height} * 100vh);
      box-sizing: border-box;

      %right-panel-item {
        flex-shrink: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
        overflow: hidden;
      }

      .datav-app-content-right-item1 {
        @extend %right-panel-item;
        height: calc(#{$right-item1-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/right-item1.png');
      }

      .datav-app-content-right-item1-content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      .datav-app-content-right-item2 {
        @extend %right-panel-item;
        height: calc(#{$right-item2-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/right-item2.png');
      }

      .datav-app-content-right-item2-content {
        flex: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        padding: calc(4 / #{$design-height} * 100vh) calc(8 / #{$design-width} * 100vw) calc(10 / #{$design-height} * 100vh);
        box-sizing: border-box;

        .item2r-stats {
          width: 100%;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: calc(4 / #{$design-width} * 100vw);
        }

        .item2r-stat {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .item2r-stat-icon-wrap {
          position: relative;
          width: calc(78 / #{$design-width} * 100vw);
          height: calc(88 / #{$design-height} * 100vh);
          display: flex;
          align-items: center;
          justify-content: center;
          background-image: url('@/assets/right-item2-icon.png');
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
        }

        .item2r-stat-num {
          position: relative;
          z-index: 1;
          display: inline-block;
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-weight: 700;
          font-size: calc(34 / #{$design-width} * 100vw);
          line-height: 1;
          letter-spacing: calc(0.5 / #{$design-width} * 100vw);
          transform: translateY(calc(-4 / #{$design-height} * 100vh));
        }

        .item2r-stat-num-text {
          display: inline-block;
          background: linear-gradient(180deg, #ffffff 0%, #8ecaff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .item2r-stat-num-shine {
          position: absolute;
          inset: 0;
          pointer-events: none;
          color: transparent;
          background: linear-gradient(110deg,
              transparent 0%,
              transparent 38%,
              rgba(0, 80, 220, 0.2) 43%,
              rgba(0, 200, 255, 0.55) 47%,
              rgba(160, 230, 255, 0.9) 49%,
              #ffffff 50%,
              rgba(160, 230, 255, 0.9) 51%,
              rgba(0, 200, 255, 0.55) 53%,
              rgba(0, 80, 220, 0.2) 57%,
              transparent 62%,
              transparent 100%);
          background-size: 220% 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 4px rgba(0, 200, 255, 0.45));
          animation: title-light-flow 5s linear infinite;
        }

        .item2r-stat-label {
          margin: calc(6 / #{$design-height} * 100vh) 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(2 / #{$design-height} * 100vh);
          font-family: 'Alibaba-PuHuiTi', sans-serif;
          font-size: calc(14 / #{$design-width} * 100vw);
          line-height: 1.25;
          color: #ffffff;
          text-align: center;
          white-space: nowrap;
        }
      }

      .datav-app-content-right-item3 {
        @extend %right-panel-item;
        height: calc(#{$right-item3-h} / #{$design-height} * 100vh);
        background-image: url('@/assets/right-item3.png');
      }

      .datav-app-content-right-item3-content {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      [class$='-title'] {
        flex-shrink: 0;
        font-family: 'Alibaba-PuHuiTi', sans-serif;
        font-weight: 700;
        font-size: calc(18 / #{$design-width} * 100vw);
        color: #ffffff;
      }

      [class$='-content'] {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
    }
  }

  .datav-app-footer {
    width: 100%;
    flex-shrink: 0;
    // 72px / 1080px，1920×1080 全屏下为 72px
    height: calc(#{$footer-height} / #{$design-height} * 100vh);
    background-image: url('@/assets/bottom.png');
    background-size: 100% 100%;
    background-position: center bottom;
    background-repeat: no-repeat;
  }
}

@keyframes title-light-flow {
  0% {
    background-position: 120% center;
  }

  100% {
    background-position: -20% center;
  }
}

.datav-app-mark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(10 / #{$design-height} * 100vh);
  position: absolute;
  transform: translate(-50%, -100%);
  pointer-events: auto;
  cursor: pointer;

  &.is-active {
    z-index: 100;
  }

  .datav-app-mark-number {
    display: flex;
    align-items: center;
    justify-content: center;
    background-repeat: no-repeat;
    box-sizing: border-box;
    padding: 0 calc(6 / #{$design-width} * 100vw);
  }

  .datav-app-mark-number img {
    width: calc(14 / #{$design-width} * 100vw);
    height: calc(14 / #{$design-width} * 100vw);
    min-width: 10px;
    min-height: 10px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .datav-app-mark-number-text {
    font-family: 'Alibaba-PuHuiTi', sans-serif;
    white-space: nowrap;
    line-height: 1;
  }

  .datav-app-mark-location {
    width: calc(24 / #{$design-width} * 100vw);
    height: auto;
    object-fit: contain;
  }
}

.datav-app-mark-dialog {
  position: absolute;
  z-index: 200;
  background: transparent;
  pointer-events: auto;
  transform: translate(0%, -10%);
}

.datav-app-mark-dialog__panel {
  position: relative;
  min-width: calc(280 / #{$design-width} * 100vw);
  min-height: calc(150 / #{$design-height} * 100vh);
  box-sizing: border-box;
  padding: calc(28 / #{$design-height} * 100vh) 0;
}

.datav-app-mark-dialog__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  z-index: 0;
}

.datav-app-mark-dialog__title,
.datav-app-mark-dialog__body {
  position: relative;
  z-index: 1;
}

.datav-app-mark-dialog__title {
  font-family: 'Alibaba-PuHuiTi', sans-serif;
  font-size: calc(15 / #{$design-width} * 100vw);
  font-weight: 700;
  color: #68ecff;
  line-height: 1.2;
  margin-bottom: calc(12 / #{$design-height} * 100vh);
  padding-left: calc(4 / #{$design-width} * 100vw);
}
.datav-app-mark-dialog__row2-divider{
  margin: 18px 0;
  font-size: 14px;
}

.datav-app-mark-dialog__row {
  margin: 16px 16px 10px 16px;
  font-family: "Alibaba-PuHuiTi", sans-serif;
  font-size: calc(16 / 1920* 100vw);
  color: #c5d5ea;
}
.datav-app-mark-dialog__row2:first-child {
  margin-top: 10px;
}
.datav-app-mark-dialog__row2 {
  margin-left: 36px;
  font-family: "Alibaba-PuHuiTi", sans-serif;
  font-size: calc(14 / 1920* 100vw);
  color: #c5d5ea;
}
.datav-app-mark-dialog__label {
  color: #9eb8d8;
}

.datav-app-mark-dialog__value {
  color: #ffffff;
}
</style>
