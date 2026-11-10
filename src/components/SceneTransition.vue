<script setup>
import { ACTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { state } = useExperience()
</script>

<template>
  <div class="veil" :class="{ 'is-on': state.transitioning }" aria-hidden="true">
    <div class="veil__black"></div>
    <div class="veil__splice"></div>
    <div class="veil__label">
      <span>ACT {{ ACTS[state.activeAct]?.numeral }}</span>
      <small>{{ ACTS[state.activeAct]?.title }}</small>
    </div>
  </div>
</template>

<style scoped>
.veil {
  position: fixed; inset: 0; z-index: var(--z-veil);
  pointer-events: none; opacity: 0;
}
.veil.is-on { animation: veil-flash 0.98s var(--ease-film) both; }

.veil__black { position: absolute; inset: 0; background: #03050a; }

.veil__splice {
  position: absolute; left: 50%; top: 50%;
  width: 0; height: 1px; transform: translate(-50%, -50%);
  background: linear-gradient(90deg, transparent, var(--gold-100), transparent);
  box-shadow: 0 0 18px rgba(232, 200, 138, 0.65);
}
.veil.is-on .veil__splice { animation: splice 0.98s var(--ease-film) both; }
@keyframes splice {
  0% { width: 0; opacity: 0; }
  35% { width: 62vw; opacity: 1; }
  100% { width: 0; opacity: 0; }
}

.veil__label {
  position: absolute; left: 50%; top: calc(50% + 2.4rem);
  transform: translateX(-50%); text-align: center;
  font-family: var(--font-display); letter-spacing: 0.4em;
  color: var(--gold-100); font-size: 0.8rem; white-space: nowrap;
}
.veil__label small {
  display: block; margin-top: 0.7rem; font-size: 0.5rem;
  letter-spacing: 0.3em; color: var(--ink-faint);
}
</style>
