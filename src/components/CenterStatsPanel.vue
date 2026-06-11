<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import CenterOrderTable from './CenterOrderTable.vue'
import type { OrderItem, ParkStatItem } from '@/types/dashboard'

/** 无接口数据时的占位，保证中部统计区与订单表布局稳定 */
const defaultParkStat: ParkStatItem[] = [
  { title: '园区入驻企业', value: '126' },
  { title: '视听相关企业', value: '59' },
  { title: '持证企业', value: '40' },
  { title: '新增企业', value: '6' },
]

const props = withDefaults(
  defineProps<{
    parkStat?: ParkStatItem[]
    orders?: OrderItem[]
  }>(),
  {
    parkStat: () => [],
    orders: () => [],
  },
)

interface CenterStatItem {
  title: string
  value: string
  display: string
  numeric: boolean
}

const centerStats = ref<CenterStatItem[]>([])

function isNumericValue(val: string) {
  return /^\d+$/.test(String(val).trim())
}

function parseNumericValue(val: string) {
  const n = parseInt(String(val).trim(), 10)
  return Number.isFinite(n) ? n : 0
}

function padDigits(value: string) {
  return String(Math.max(0, parseNumericValue(value))).padStart(4, '0').split('')
}

function animateStats(config: ParkStatItem[]) {
  const duration = 1600
  const start = performance.now()
  centerStats.value = config.map((item) => {
    const value = String(item.value)
    return {
      title: item.title,
      value,
      display: isNumericValue(value) ? '0' : value,
      numeric: isNumericValue(value),
    }
  })

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration)
    const ease = 1 - (1 - t) ** 3
    centerStats.value = config.map((item) => {
      const value = String(item.value)
      if (!isNumericValue(value)) {
        return { title: item.title, value, display: value, numeric: false }
      }
      return {
        title: item.title,
        value,
        display: String(Math.round(parseNumericValue(value) * ease)),
        numeric: true,
      }
    })
    if (t < 1) requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

function applyParkStat(list: ParkStatItem[]) {
  const config = list.length ? list : defaultParkStat
  animateStats(config)
}

onMounted(() => {
  applyParkStat(props.parkStat)
})

watch(
  () => props.parkStat,
  (list) => {
    applyParkStat(list ?? [])
  },
  { deep: true },
)
</script>

<template>
  <div class="center-panel">
    <div class="center-panel__stats">
      <div class="center-cards">
        <div v-for="(item, i) in centerStats" :key="'center-stat-' + i" class="center-card">
          <h3 class="center-card__title">{{ item.title }}</h3>
          <div class="center-card__value">
            <div v-if="item.numeric" class="center-digits">
              <span
                v-for="(d, di) in padDigits(item.display)"
                :key="'d-' + i + '-' + di"
                class="center-digit"
              >
                <span class="center-digit__num">{{ d }}</span>
              </span>
            </div>
            <span v-else class="center-text-value">{{ item.display }}</span>
            <span class="center-card__unit">家</span>
          </div>
        </div>
      </div>
    </div>
    <div class="center-panel__order">
      <CenterOrderTable :orders="orders" />
    </div>
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;
$design-height: 1080;
$digit-w: 34;
$digit-h: 56;

.center-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.center-panel__stats {
  flex-shrink: 0;
}

.center-panel__order {
  flex: 0 0 calc(240 / #{$design-height} * 100vh);
  min-height: 0;
  margin-top: auto;
  padding: 0 calc(10 / #{$design-width} * 100vw) calc(12 / #{$design-height} * 100vh);
  box-sizing: border-box;
}

.center-cards {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: calc(8 / #{$design-width} * 100vw);
  box-sizing: border-box;
  height: calc(100 / #{$design-height} * 100vh);
  margin: 0 calc(10 / #{$design-width} * 100vw);


}

.center-card {
  flex: 1;
  min-width: 0;
  text-align: center;
  background: url('@/assets/center-bg.png') center / 100% 100% no-repeat;
  padding: calc(16 / #{$design-height} * 100vh) calc(16 / #{$design-width} * 100vw)
  calc(16 / #{$design-height} * 100vh);
}

.center-card__title {
  margin: 0 0 calc(8 / #{$design-height} * 100vh);
  font-size: calc(16 / #{$design-width} * 100vw);
  font-weight: 500;
  text-align: left;
  color: #ffffff;
  padding-left: calc(20 / #{$design-width} * 100vw);
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.center-card__value {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: calc(4 / #{$design-width} * 100vw);
}

.center-digits {
  display: flex;
  gap: calc(4 / #{$design-width} * 100vw);
}

.center-digit {
  width: calc(#{$digit-w} / #{$design-width} * 100vw);
  height: calc(#{$digit-h} / #{$design-height} * 100vh);
  background: url('@/assets/center-number-bg.svg') center / 100% 100% no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center-digit__num {
  font-size: calc(28 / #{$design-width} * 100vw);
  font-weight: 700;
  color: #fff;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
  text-shadow: 0 0 12px rgba(0, 200, 255, 0.6);
}

.center-card__unit {
  font-size: calc(14 / #{$design-width} * 100vw);
  color: #9eb8d8;
  padding-bottom: calc(6 / #{$design-height} * 100vh);
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.center-text-value {
  font-size: calc(28 / #{$design-width} * 100vw);
  font-weight: 700;
  color: #fff;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
  text-shadow: 0 0 12px rgba(0, 200, 255, 0.6);
  line-height: 1;
  padding-bottom: calc(6 / #{$design-height} * 100vh);
}
</style>
