<script setup>
import { ref, computed } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import MusicBox from '../components/MusicBox.vue'
import { SCENES, PLATES, OVERLAYS, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { state, almostSay } = useExperience()
const kept = ref(null)

// A garland of real, clickable lights laid over the tree in the photograph.
const LIGHTS = Array.from({ length: 20 }, (_, i) => {
  const t = i / 19
  const y = 17 + t * 58
  const spread = 1.5 + t * 16
  const side = i % 2 === 0 ? -1 : 1
  const x = side * spread * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.6)))
  return {
    x: `calc(50% + ${x.toFixed(2)}%)`,
    y: `${y.toFixed(2)}%`,
    size: `${(5.5 + t * 5).toFixed(1)}px`,
    delay: `${((i * 0.27) % 3).toFixed(2)}s`,
  }
})

const countText = computed(() => {
  if (kept.value !== null) return `第 ${kept.value + 1} 盏，只为你亮着`
  return state.treeLightsOn ? '20 盏灯里，有一盏是替你留的' : '20 盏灯 · 都替我沉默着'
})

function toggleLights() { state.treeLightsOn = !state.treeLightsOn }

/* One light can be kept for the person I did not dare to name — either with
   the little chip, or by double-clicking any bulb on the garland. */
function keepLight(i = 10) {
  kept.value = kept.value === i ? null : i
  if (kept.value !== null) {
    state.treeLightsOn = true
    almostSay('许愿的时候，我只敢把你的名字念到一半。')
  }
}
function onLightClick(i, e) {
  if (e.detail >= 2) { keepLight(i); return }
  toggleLights()
}
</script>

<template>
  <SceneShell
    :index="2"
    :image="SCENES.tree"
    numeral="III"
    stage-class="scene__stage--full tree-layout"
    object-position="50% 48%"
    light-position="left: 30%; top: 2%;"
  >
    <template #stage>
      <div class="tree-stage">
        <div class="tree-stage__head js-reveal">
          <span class="act-numeral">ACT III &nbsp;·&nbsp; THE LIGHT I KEPT</span>
          <p class="eyebrow">ONE WISH I NEVER FINISHED</p>
          <h2 class="scene-title js-title">THE CHRISTMAS TREE<em>把话，挂到最高的那盏灯上</em></h2>
          <div class="tree-stage__keep-row">
            <button class="chip tree-stage__keep" :class="{ 'is-on': kept !== null }" @click="keepLight()">✦ 留一盏给不敢说的人</button>
            <small>双击任意一盏灯，也能留下它</small>
          </div>
        </div>

        <div class="tree-bloom" aria-hidden="true">
          <img :src="CUTOUTS.goldenStar" alt="" />
        </div>

        <div class="tree-lights" :class="{ 'is-off': !state.treeLightsOn }">
          <button
            v-for="(l, i) in LIGHTS"
            :key="i"
            class="tree-light"
            :class="{ 'is-kept': kept === i }"
            :style="{ left: l.x, top: l.y, width: l.size, height: l.size, animationDelay: l.delay }"
            :aria-label="`第 ${i + 1} 盏树灯`"
            @click="onLightClick(i, $event)"
          ></button>
        </div>

        <div class="tree-stage__control js-reveal">
          <span class="gold-rule"></span>
          <p class="tree-stage__lede">听说第一盏灯亮起时许愿最灵。我闭眼许到一半，忽然怕被你听见，就睁开了眼。</p>
          <button class="film-btn" @click="toggleLights">
            <span class="film-btn__dot"></span>
            {{ state.treeLightsOn ? 'DIM THE LIGHTS' : 'LIGHT THE TREE' }}
          </button>
          <div class="tree-stage__countline">
            <p class="tree-stage__count">{{ countText }}</p>
          </div>
        </div>
      </div>
    </template>

    <template #atmosphere>
      <img class="atmo atmo--fog" :src="OVERLAYS.fog" alt="" />
      <img class="atmo tree__dust" :src="OVERLAYS.goldenDust" alt="" />
      <img class="tree__starfield" :src="CUTOUTS.star" alt="" />
    </template>

    <template #mid>
      <div class="depth-object tree__bell"><img :src="CUTOUTS.bell" alt="" /></div>
    </template>

    <template #foreground>
      <div class="tree__ornament"><div class="plate"><img :src="PLATES.ornament" alt="" /></div></div>
      <div class="tree__snowflake"><div class="plate"><img :src="PLATES.snowflake" alt="" /></div></div>
      <!-- A real object on the snow at the tree's right, not a floating widget. -->
      <MusicBox />
    </template>
  </SceneShell>
</template>

<style scoped>
.tree-stage { position: absolute; inset: 0; }
.tree-stage__head {
  position: absolute; top: 13vh; left: 4%;
  width: min(36vw, 470px); text-align: left;
}
.tree-stage__head .gold-rule { margin: 1.4rem 0 0; }

.tree-stage__control {
  position: absolute; bottom: 9vh; left: 4%;
  display: flex; flex-direction: column; align-items: flex-start; gap: 0.85rem;
  width: min(34vw, 420px); text-align: left;
}
.tree-stage__control .gold-rule { margin: 0 0 0.3rem; }
.tree-stage__head .eyebrow { margin-bottom: 1rem; }
.tree-stage__head .scene-title { font-size: clamp(1.9rem, 3.5vw, 3.6rem); }
/* Kept high in the shaded left wing — the lower-left note must never cover it. */
.tree-stage__keep-row { display: flex; align-items: center; gap: 0.8rem; margin-top: 1.25rem; }
.tree-stage__keep-row small {
  font-family: var(--font-cn); font-size: 0.56rem;
  letter-spacing: 0.1em; color: var(--ink-faint);
}
.tree-stage__keep {
  font-family: var(--font-cn); font-size: 0.56rem;
  letter-spacing: 0.1em; padding: 0.35rem 0.75rem;
}
.tree-stage__lede { margin: 0; font-family: var(--font-elegant); font-size: 1.12rem; color: var(--ink-soft); }
.tree-stage__count { margin: 0; font-family: var(--font-display); font-size: 0.56rem; letter-spacing: 0.24em; color: var(--ink-faint); }

.tree-bloom {
  position: absolute; left: 50%; top: 8%;
  width: clamp(70px, 8.5vw, 130px); transform: translateX(-50%);
  opacity: 0.32;
  animation: star-pulse 4.5s var(--ease-soft) infinite;
  pointer-events: none;
}
.tree-bloom img { width: 100%; }

/* The garland covers the whole shot; only the bulbs may catch a click, so
   the transparent layer never steals the "keep one light" control above it. */
.tree-lights { position: absolute; inset: 0; pointer-events: none; transition: opacity 1.2s var(--ease-soft); }
.tree-lights.is-off { opacity: 0.32; }
.tree-light {
  position: absolute; padding: 0; border-radius: 50%;
  background: #fff1c9;
  box-shadow: 0 0 8px 2px rgba(255, 196, 100, 0.85), 0 0 24px 8px rgba(255, 160, 60, 0.45);
  transform: translate(-50%, -50%);
  animation: twinkle 3s var(--ease-soft) infinite;
  pointer-events: auto;
  transition: box-shadow 0.9s var(--ease-soft), background 0.9s var(--ease-soft);
}
.tree-light:hover { box-shadow: 0 0 12px 4px #fff4d6, 0 0 46px 18px rgba(255, 190, 90, 0.7); }
.tree-lights.is-off .tree-light {
  background: rgba(255, 220, 160, 0.36);
  box-shadow: 0 0 5px 1px rgba(255, 180, 90, 0.2);
  animation-play-state: paused;
}
/* One light kept for a name I did not finish saying. Only one element beats,
   so this stays as cheap as the original twinkle. */
.tree-lights .tree-light.is-kept {
  z-index: 2;
  background: #fff8e2;
  box-shadow: 0 0 14px 5px #ffe6ab, 0 0 60px 24px rgba(255, 190, 90, 0.6);
  animation: kept-heartbeat 2.3s var(--ease-soft) infinite;
}
@keyframes kept-heartbeat {
  0%, 100% { transform: translate(-50%, -50%) scale(1.9); }
  50% { transform: translate(-50%, -50%) scale(2.7); }
}

.tree-stage__countline { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }

.tree__dust { opacity: 0.07; animation: slow-drift 20s ease-in-out infinite; }
.tree__starfield {
  position: absolute; left: 4%; top: 6%; width: clamp(90px, 10vw, 150px);
  opacity: 0.4; filter: drop-shadow(0 0 22px rgba(255, 202, 120, 0.35));
  animation: gentle-float 10s var(--ease-soft) infinite;
}
.tree__bell {
  width: clamp(80px, 9vw, 140px); right: 12%; top: 26%;
  opacity: 0.8; animation: gentle-float 9s var(--ease-soft) infinite -2s;
  filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.8));
}
.tree__ornament, .tree__snowflake { position: absolute; width: clamp(130px, 15vw, 240px); opacity: 0.5; }
.tree__ornament { left: -3%; bottom: -8%; filter: blur(2.5px) saturate(0.8); }
.tree__snowflake { right: -4%; top: 6%; filter: blur(3.5px) saturate(0.7); opacity: 0.38; }
.tree__ornament .plate, .tree__snowflake .plate { aspect-ratio: 1; }

@media (max-width: 900px) {
  .tree-stage__head { top: 9vh; left: 5%; right: 5%; width: auto; text-align: center; }
  .tree-stage__head .gold-rule { margin-left: auto; margin-right: auto; }
  .tree-stage__keep-row { justify-content: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.9rem; }
  .tree-stage__control {
    bottom: 7vh; left: 5%; right: 5%; width: auto;
    align-items: center; text-align: center; gap: 0.6rem;
  }
  .tree-stage__control .gold-rule { margin: 0 auto 0.2rem; }
  .tree-stage__lede { font-size: 0.95rem; }
  .tree__starfield, .tree__bell, .tree__snowflake { display: none; }
  .tree__ornament { width: 130px; opacity: 0.3; }
  .tree-bloom { top: 12%; width: 90px; }
  .tree-lights { top: 6%; }
}
@media (max-width: 480px) {
  .tree-stage__head { top: 9vh; }
  .tree-stage__keep-row small { display: none; }
  .tree-stage__control { bottom: 6vh; }
  .tree-stage__count { display: none; }
}
</style>
