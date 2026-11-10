<script setup>
import { computed } from 'vue'
import { ACTS, ACT_COUNT } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { state, nextAct, prevAct, toggleAutoPlay } = useExperience()
const current = computed(() => ACTS[state.activeAct] ?? ACTS[0])
const first = computed(() => state.activeAct === 0)
const last = computed(() => state.activeAct === ACT_COUNT - 1)
</script>

<template>
  <div class="film-console" role="group" aria-label="分幕放映控制">
    <button
      class="film-console__arrow"
      :disabled="first"
      aria-label="上一幕"
      @click="prevAct"
    >‹<span>PREV</span></button>

    <div class="film-console__readout">
      <span class="film-console__count">ACT {{ current.numeral }} <i>/ VI</i></span>
      <span class="film-console__name">{{ current.cn }}</span>
      <transition name="hint">
        <span class="film-console__hint" v-if="first">滚轮 · 方向键 · 上滑翻幕 · 双击有回声</span>
      </transition>
    </div>

    <button
      class="film-console__arrow film-console__arrow--next"
      :disabled="last"
      aria-label="下一幕"
      @click="nextAct"
    ><span>NEXT</span>›</button>

    <span class="film-console__divider" aria-hidden="true"></span>

    <button
      class="film-console__auto"
      :class="{ 'is-on': state.autoPlay }"
      :aria-pressed="state.autoPlay"
      :title="state.autoPlay ? '暂停自动放映' : '开启自动放映'"
      @click="toggleAutoPlay"
    >
      <span class="film-console__auto-glyph">{{ state.autoPlay ? '❚❚' : '▶' }}</span>
      <span class="film-console__auto-text">自动放映</span>
    </button>
  </div>
</template>

<style scoped>
.film-console {
  position: fixed;
  left: 50%;
  bottom: calc(var(--letterbox) + 1.15rem);
  transform: translateX(-50%);
  z-index: var(--z-ui);
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 2vw, 2rem);
  padding: 0.55rem clamp(0.9rem, 2vw, 1.8rem);
  white-space: nowrap;
  font-family: var(--font-display);
  color: var(--ink-soft);
  isolation: isolate;
}
/* A soft pool of darkness, never a card with visible edges. */
.film-console::before {
  content: '';
  position: absolute;
  inset: -70% -18%;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(ellipse 60% 62% at 50% 50%, rgba(3, 6, 13, 0.82), transparent 78%);
}

.film-console__arrow {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.3rem;
  line-height: 1;
  color: var(--gold-100);
  transition: color 0.4s var(--ease-soft), transform 0.4s var(--ease-soft), opacity 0.4s var(--ease-soft);
}
.film-console__arrow span {
  font-size: 0.55rem;
  letter-spacing: 0.26em;
  color: var(--ink-soft);
}
.film-console__arrow:hover:not(:disabled) { transform: translateY(-2px); color: #fff7e4; }
.film-console__arrow:hover:not(:disabled) span { color: var(--gold-100); }
.film-console__arrow:disabled { opacity: 0.24; cursor: default; }

.film-console__readout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  min-width: 8.5rem;
}
.film-console__count {
  font-size: 0.58rem;
  letter-spacing: 0.32em;
  color: var(--gold-100);
}
.film-console__count i { font-style: normal; color: var(--ink-soft); letter-spacing: 0.18em; }
.film-console__name {
  font-family: var(--font-cn);
  font-size: 0.64rem;
  letter-spacing: 0.32em;
  color: var(--ink-soft);
}
.film-console__hint {
  position: absolute;
  top: -1.7rem;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-cn);
  font-size: 0.58rem;
  letter-spacing: 0.24em;
  color: var(--gold-100);
  opacity: 0.82;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
}
.hint-leave-active { transition: opacity 0.8s var(--ease-soft); }
.hint-leave-to { opacity: 0; }

.film-console__divider {
  width: 1px;
  height: 22px;
  background: linear-gradient(180deg, transparent, rgba(232, 200, 138, 0.35), transparent);
}

.film-console__auto {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-family: var(--font-cn);
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  color: var(--ink-soft);
  padding: 0.32rem 0.6rem;
  border: 1px solid rgba(232, 200, 138, 0.16);
  border-radius: 999px;
  transition: all 0.4s var(--ease-soft);
}
.film-console__auto-glyph { font-size: 0.55rem; color: var(--gold-300); }
.film-console__auto:hover,
.film-console__auto.is-on {
  color: var(--gold-100);
  border-color: rgba(232, 200, 138, 0.55);
  background: rgba(232, 200, 138, 0.08);
  box-shadow: 0 0 18px rgba(232, 200, 138, 0.12);
}

@media (max-width: 760px) {
  .film-console {
    width: calc(100vw - 1.4rem);
    justify-content: center;
    gap: 0.7rem;
    bottom: calc(var(--letterbox) + 0.65rem);
    padding: 0.35rem 0.3rem;
  }
  .film-console::before { inset: -90% -6%; }
  .film-console__arrow span { display: none; }
  .film-console__arrow { font-size: 1.5rem; padding: 0 0.1rem; }
  .film-console__readout { min-width: 6.4rem; }
  .film-console__count { font-size: 0.52rem; letter-spacing: 0.2em; }
  .film-console__name { font-size: 0.58rem; letter-spacing: 0.18em; }
  .film-console__hint { top: -1.5rem; font-size: 0.52rem; letter-spacing: 0.12em; }
  .film-console__divider { height: 18px; }
  .film-console__auto-text { display: none; }
  .film-console__auto { padding: 0.3rem 0.5rem; }
}
</style>
