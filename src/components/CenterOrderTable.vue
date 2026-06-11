<script setup lang="ts">
import { computed } from 'vue'
import type { OrderItem } from '@/types/dashboard'

export type CenterOrderRow = OrderItem

const props = withDefaults(
  defineProps<{
    orders?: OrderItem[]
  }>(),
  {
    orders: () => [],
  },
)

const columns = [
  { key: 'orderType', label: '订单类型', width: '13%' },
  { key: 'issueCompany', label: '发单企业', width: '24%' },
  { key: 'receiveCompany', label: '接单企业', width: '24%' },
  { key: 'receiveTime', label: '接单时间', width: '24%' },
  { key: 'completeTime', label: '完成时间', width: '15%' },
] as const

/** 无缝滚动：总行数为偶数倍副本，动画 translateY(-50%) 才能循环 */
const scrollRows = computed(() => {
  const list = props.orders
  if (!list.length) return []

  let repeat = 2
  while (list.length * repeat < 8) {
    repeat += 2
  }

  const result: OrderItem[] = []
  for (let i = 0; i < repeat; i++) {
    result.push(...list)
  }
  return result
})

const canScroll = computed(() => scrollRows.value.length > 0)

function displayCell(key: (typeof columns)[number]['key'], row: OrderItem) {
  let raw = String(row[key] ?? '').trim()
  if (!raw || raw === 'NaN' || raw.toLowerCase() === 'nan' || raw === 'null') {
    return '—'
  }
  if (key === 'completeTime' && raw.includes(' ')) {
    return raw.split(' ')[0]
  }
  return raw
}
</script>

<template>
  <div class="order-table-wrap">
    <table class="order-table order-table--head">
      <colgroup>
        <col v-for="col in columns" :key="'col-h-' + col.key" :style="{ width: col.width }" />
      </colgroup>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
        </tr>
      </thead>
    </table>
    <div class="order-table__body">
      <div class="order-table__scroll" :class="{ 'is-scrolling': canScroll }">
        <div class="order-table__list">
          <div v-for="(row, i) in scrollRows" :key="'order-' + i" class="order-table__row">
            <span
              v-for="col in columns"
              :key="col.key + '-' + i"
              class="order-table__cell"
              :style="{ flex: `0 0 ${col.width}` }"
              :title="String(row[col.key] ?? '')"
            >
              {{ displayCell(col.key, row) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;
$design-height: 1080;

$line-blue: rgba(24, 144, 255, 0.45);
$header-bg: rgba(0, 71, 157, 0.5);
$row-bg: rgba(0, 35, 80, 0.75);
$row-gap: 8px;

.order-table-wrap {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: transparent;
}

.order-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  border-spacing: 0;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.order-table--head {
  flex-shrink: 0;
  border-bottom: 1px solid $line-blue;
  border-top: 1px solid $line-blue;
  border-left: 1px solid $line-blue;
  border-right: 1px solid $line-blue;
}

.order-table th {
  padding: calc(14 / #{$design-height} * 100vh) calc(12 / #{$design-width} * 100vw);
  background: $header-bg;
  color: #ffffff;
  font-size: calc(14 / #{$design-width} * 100vw);
  font-weight: 500;
  text-align: left;
  white-space: nowrap;

}

.order-table th:first-child {
  padding-left: calc(20 / #{$design-width} * 100vw);
}

.order-table__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: transparent;
}

.order-table__scroll {
  will-change: transform;

  &.is-scrolling {
    animation: order-table-scroll 24s linear infinite;
  }

  &:hover {
    animation-play-state: paused;
  }
}

.order-table__list {
  display: flex;
  flex-direction: column;
}

.order-table__row {
  display: flex;
  align-items: stretch;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: $row-gap;
  background: $row-bg;
  border: 1px solid rgba(24, 144, 255, 0.22);
}

.order-table__cell {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: calc(12 / #{$design-height} * 100vh) calc(12 / #{$design-width} * 100vw);
  color: #d1d1d1;
  font-size: calc(13 / #{$design-width} * 100vw);
  font-weight: 400;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
  box-sizing: border-box;
  background: transparent;

  &:first-child {
    padding-left: calc(20 / #{$design-width} * 100vw);
  }
}

@keyframes order-table-scroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}
</style>
