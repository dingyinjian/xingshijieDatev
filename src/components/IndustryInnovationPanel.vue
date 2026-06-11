<script setup lang="ts">
import { computed } from 'vue'
import icon1 from '@/assets/right-item3-icon1.png'
import icon2 from '@/assets/right-item3-icon2.png'
import icon3 from '@/assets/right-item3-icon3.png'
import icon4 from '@/assets/right-item3-icon4.png'
import type { IndustryItem } from '@/types/dashboard'

const props = withDefaults(
  defineProps<{
    industry?: IndustryItem[]
  }>(),
  {
    industry: () => [],
  },
)

const icons = [icon1, icon2, icon3, icon4]

const cards = computed(() =>
  props.industry.map((item, i) => ({
    ...item,
    icon: icons[i % icons.length],
  })),
)
</script>

<template>
  <div class="item3r-grid">
    <div v-for="(card, i) in cards" :key="'item3r-' + i" class="item3r-card">
      <div class="item3r-icon" :style="{ backgroundImage: `url(${card.icon})` }" />
      <div class="item3r-body">
        <div class="item3r-value">
          <span class="item3r-num">{{ card.value }}</span>
          <span class="item3r-unit">{{ card.unit }}</span>
        </div>
        <p class="item3r-label">{{ card.label }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;
$design-height: 1080;

.item3r-grid {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: calc(10 / #{$design-height} * 100vh) calc(8 / #{$design-width} * 100vw);
  padding: calc(4 / #{$design-height} * 100vh) calc(10 / #{$design-width} * 100vw)
    calc(8 / #{$design-height} * 100vh);
  box-sizing: border-box;
}

.item3r-card {
  display: flex;
  align-items: center;
  gap: calc(8 / #{$design-width} * 100vw);
  min-width: 0;
}

.item3r-icon {
  flex-shrink: 0;
  width: calc(48 / #{$design-width} * 100vw);
  height: calc(48 / #{$design-width} * 100vw);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.item3r-body {
  min-width: 0;
}

.item3r-value {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.item3r-num {
  font-size: calc(34 / #{$design-width} * 100vw);
  font-weight: 700;
  color: #fff;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.item3r-unit {
  font-size: calc(12 / #{$design-width} * 100vw);
  color: #9eb8d8;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
}

.item3r-label {
  font-size: calc(14 / #{$design-width} * 100vw);
  color: #ffffff;
  font-family: 'Alibaba-PuHuiTi', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
