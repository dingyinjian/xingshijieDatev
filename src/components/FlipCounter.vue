<script setup lang="ts">
import { computed } from 'vue'
import FlipDigit from './FlipDigit.vue'

const props = withDefaults(
  defineProps<{
    value: number
    digits?: number
  }>(),
  {
    digits: 6,
  },
)

const digitList = computed(() => {
  const raw = Math.max(0, Math.floor(props.value))
  const str = String(raw).padStart(props.digits, '0')
  return str.slice(-props.digits).split('')
})
</script>

<template>
  <div class="flip-counter">
    <FlipDigit v-for="(d, i) in digitList" :key="i" :digit="d" />
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;

.flip-counter {
  display: flex;
  align-items: center;
  gap: calc(6 / #{$design-width} * 100vw);
}
</style>
