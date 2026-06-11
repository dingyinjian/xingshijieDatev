<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  digit: string
}>()

const current = ref(props.digit)
const previous = ref(props.digit)
const flipping = ref(false)

watch(
  () => props.digit,
  (next, prev) => {
    if (next === prev) return
    previous.value = prev ?? current.value
    flipping.value = true
    window.setTimeout(() => {
      current.value = next
      flipping.value = false
    }, 520)
  },
)
</script>

<template>
  <div class="flip-digit">
    <div class="flip-digit__bg" aria-hidden="true" />
    <div class="flip-digit__card" :class="{ 'is-flipping': flipping }">
      <div class="flip-digit__half flip-digit__top">
        <span class="flip-digit__num">{{ flipping ? previous : current }}</span>
      </div>
      <div class="flip-digit__half flip-digit__bottom">
        <span class="flip-digit__num">{{ flipping ? current : current }}</span>
      </div>
      <div v-if="flipping" class="flip-digit__half flip-digit__top-flip">
        <span class="flip-digit__num">{{ previous }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$design-width: 1920;
$design-height: 1080;
$digit-w: 50;
$digit-h: 70;

.flip-digit {
  position: relative;
  width: calc(#{$digit-w} / #{$design-width} * 100vw);
  height: calc(#{$digit-h} / #{$design-height} * 100vh);
  flex-shrink: 0;
  perspective: calc(320 / #{$design-width} * 100vw);
}

.flip-digit__bg {
  position: absolute;
  inset: 0;
  background: url('@/assets/left-item3-icon.svg') center / 100% 100% no-repeat;
  pointer-events: none;
}

.flip-digit__card {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
  transform-style: preserve-3d;
}

.flip-digit__half {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.flip-digit__top {
  top: 0;
  align-items: flex-end;
  z-index: 2;
}

.flip-digit__bottom {
  bottom: 0;
  align-items: flex-start;
  z-index: 1;
}

.flip-digit__top-flip {
  top: 0;
  align-items: flex-end;
  transform-origin: center bottom;
  animation: flip-digit-down 0.52s ease-in-out forwards;
  z-index: 3;
  backface-visibility: hidden;
}

.flip-digit__num {
  font-family: 'Alibaba-PuHuiTi', sans-serif;
  font-weight: 700;
  font-size: calc(34 / #{$design-width} * 100vw);
  line-height: calc(#{$digit-h} / #{$design-height} * 100vh);
  height: calc(#{$digit-h} / #{$design-height} * 100vh);
  display: block;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #8ecaff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.flip-digit__top .flip-digit__num,
.flip-digit__top-flip .flip-digit__num {
  transform: translateY(50%);
}

.flip-digit__bottom .flip-digit__num {
  transform: translateY(-50%);
}

@keyframes flip-digit-down {
  0% {
    transform: rotateX(0deg);
  }
  100% {
    transform: rotateX(-180deg);
  }
}
</style>
