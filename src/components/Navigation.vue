<script setup>
import { computed } from 'vue'
import { ACTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { state, goToAct } = useExperience()
const progressPct = computed(() => `${(state.progress * 100).toFixed(2)}%`)
</script>

<template>
  <header class="brand">
    <button class="brand__mark" aria-label="回到开场" @click="goToAct(0)">
      <span class="brand__star">✦</span>
      <span class="brand__text">
        <b>THE MAGIC OF CHRISTMAS</b>
        <small>六幕冬夜，一句没说完的话</small>
      </span>
    </button>
  </header>

  <div class="film-progress" aria-hidden="true"><i :style="{ width: progressPct }"></i></div>

  <nav class="act-nav" aria-label="场景导航">
    <span class="act-nav__rail" aria-hidden="true"></span>
    <ul>
      <li v-for="(act, i) in ACTS" :key="act.id">
        <button
          :class="{ 'is-current': state.activeAct === i }"
          :aria-current="state.activeAct === i ? 'true' : undefined"
          :title="`${act.kicker} — ${act.title}`"
          @click="goToAct(i)"
        >
          <span class="act-nav__dot"></span>
          <span class="act-nav__num">{{ act.numeral }}</span>
          <span class="act-nav__name">{{ act.title }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.brand {
  position: fixed;
  top: calc(var(--letterbox) + 1.4rem);
  left: clamp(1rem, 2.6vw, 2.8rem);
  z-index: var(--z-ui);
}
.brand__mark { display: flex; align-items: center; gap: 0.8rem; text-align: left; }
.brand__star { font-size: 1.15rem; color: var(--gold-300); text-shadow: 0 0 18px rgba(232, 200, 138, 0.7); animation: breath 5s var(--ease-soft) infinite; }
.brand__text b {
  display: block; font-family: var(--font-display); font-weight: 500;
  font-size: clamp(0.58rem, 0.82vw, 0.78rem); letter-spacing: 0.3em;
  color: var(--gold-100); white-space: nowrap;
}
.brand__text small {
  display: block; margin-top: 0.28rem; font-family: var(--font-cn);
  font-size: 0.6rem; letter-spacing: 0.24em; color: var(--ink-faint);
}
.brand__mark:hover .brand__text b { color: #fff8e8; }

.film-progress {
  position: fixed; top: 0; left: 0; right: 0; height: 2px;
  z-index: var(--z-ui); background: rgba(232, 200, 138, 0.09);
}
.film-progress i {
  display: block; height: 100%;
  background: linear-gradient(90deg, rgba(207, 160, 89, 0.35), var(--gold-100));
  box-shadow: 0 0 10px rgba(232, 200, 138, 0.55);
  transition: width 0.75s var(--ease-soft);
}

.act-nav {
  position: fixed;
  right: clamp(0.9rem, 2.4vw, 2.6rem);
  top: 50%;
  transform: translateY(-50%);
  z-index: var(--z-ui);
}
.act-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.act-nav__rail {
  position: absolute; right: 8px; top: 12px; bottom: 12px; width: 1px;
  background: linear-gradient(180deg, transparent, rgba(232, 200, 138, 0.22), transparent);
}
.act-nav button {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
  width: 100%; padding: 0.35rem 0.1rem;
  font-family: var(--font-display); color: var(--ink-faint);
  transition: color 0.4s var(--ease-soft);
}
.act-nav__num { font-size: 0.62rem; letter-spacing: 0.15em; width: 1.6rem; text-align: right; opacity: 0.7; }
.act-nav__name {
  font-size: 0.55rem; letter-spacing: 0.2em; white-space: nowrap;
  max-width: 0; overflow: hidden; opacity: 0;
  transition: max-width 0.5s var(--ease-soft), opacity 0.4s var(--ease-soft);
}
.act-nav__dot {
  width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%;
  border: 1px solid rgba(232, 200, 138, 0.5);
  background: transparent; transition: all 0.4s var(--ease-soft);
}
.act-nav button:hover .act-nav__name,
.act-nav button.is-current .act-nav__name { max-width: 200px; opacity: 1; }
.act-nav button:hover { color: var(--gold-100); }
.act-nav button.is-current { color: var(--gold-100); }
.act-nav button.is-current .act-nav__dot {
  background: var(--gold-100); border-color: var(--gold-100);
  box-shadow: 0 0 12px var(--gold-300), 0 0 26px rgba(232, 200, 138, 0.4);
  transform: scale(1.35);
}

@media (max-width: 900px) {
  .act-nav { right: 0.6rem; }
  .act-nav__name { display: none; }
  .act-nav__num { display: none; }
  .act-nav button { padding: 0.5rem 0.35rem; }
  .act-nav__rail { right: 11px; }
  .brand__text small { display: none; }
}
@media (max-width: 480px) {
  .brand__text b { font-size: 0.52rem; letter-spacing: 0.2em; }
  .act-nav__dot { width: 5px; height: 5px; flex-basis: 5px; }
}
</style>
