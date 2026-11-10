<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { SnowEngine } from '../composables/useSnowParticles.js'
import { useExperience } from '../composables/useExperience.js'

const canvas = ref(null)
const { state } = useExperience()
let engine = null

onMounted(async () => {
  engine = new SnowEngine(canvas.value, {
    density: state.snowDensity,
    reducedMotion: state.reducedMotion,
  })
  await engine.loadSprites()
  if (!canvas.value) return
  engine.mount()
  engine.setEnabled(state.snowEnabled)
})

watch(() => state.snowEnabled, (on) => {
  if (engine) engine.setEnabled(on)
})

onUnmounted(() => engine && engine.destroy())
</script>

<template>
  <canvas
    ref="canvas"
    class="snow-canvas"
    :class="{ 'is-hidden': !state.snowEnabled }"
    aria-hidden="true"
  ></canvas>
</template>

<style scoped>
.snow-canvas {
  position: fixed;
  inset: 0;
  z-index: var(--z-snow);
  pointer-events: none;
  opacity: 1;
  transition: opacity 1.1s var(--ease-soft);
  mix-blend-mode: screen;
}
.snow-canvas.is-hidden { opacity: 0; }
</style>
