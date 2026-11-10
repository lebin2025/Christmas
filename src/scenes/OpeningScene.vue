<script setup>
import { ref } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import { SCENES, PLATES, OVERLAYS, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'
import { useAudio } from '../composables/useAudio.js'

const { goToAct, almostSay } = useExperience()
const audio = useAudio()
const hoveringKey = ref(false)
let lastReveal = 0

function enter() {
  audio.play()
  goToAct(1)
}
/* A double click on the key fires two clicks; one line is enough. */
function revealKey() {
  const now = Date.now()
  if (now - lastReveal < 600) return
  lastReveal = now
  almostSay('我提早到了，只为了在人群里多看你一眼。')
}
</script>

<template>
  <SceneShell
    :index="0"
    :image="SCENES.arrival"
    numeral="I"
    kicker="ACT I"
    eyebrow="BEFORE ANYTHING WAS SAID"
    title="THE ARRIVAL"
    subtitle="我比约定，早到了一整个冬天"
    lede="雪落在很远的地方，远到能听见。我提前到了，却希望你晚一点。"
    hint="TURN THE PAGE · I'M STILL HERE"
    object-position="50% 58%"
    light-position="left: -12%; top: 8%;"
  >
    <template #atmosphere>
      <img class="atmo atmo--beam" :src="OVERLAYS.moonForest" alt="" />
      <img class="atmo atmo--fog" :src="OVERLAYS.fog" alt="" />
      <img class="atmo arrival__dust" :src="OVERLAYS.goldenDust" alt="" />
    </template>

    <template #mid>
      <div class="depth-object arrival__bow" :style="{ '--tilt': '-12deg' }">
        <img :src="CUTOUTS.bow" alt="" />
      </div>
    </template>

    <template #interaction>
      <div class="arrival__key">
        <button
          class="plate arrival__key-plate"
          :class="{ 'is-held': hoveringKey }"
          aria-label="钥匙：为什么来得这么早"
          @mouseenter="hoveringKey = true"
          @mouseleave="hoveringKey = false"
          @click="revealKey"
        >
          <img :src="PLATES.key" alt="一把金色古董钥匙" />
        </button>
        <span class="act-numeral">A KEY TO THE NIGHT</span>
        <p>{{ hoveringKey ? '其实，我是来找一个人的。' : '有些门，我只在心里敲过。' }}</p>
        <button class="film-btn" @click="enter">
          <span class="film-btn__dot"></span>ENTER THE NIGHT
        </button>
      </div>
    </template>

    <template #foreground>
      <div class="depth-object arrival__pine arrival__pine--left"><img :src="CUTOUTS.pine" alt="" /></div>
      <div class="depth-object arrival__pine arrival__pine--right"><img :src="CUTOUTS.pine" alt="" /></div>
    </template>
  </SceneShell>
</template>

<style scoped>
.arrival__dust { opacity: 0.055; animation: slow-drift 24s ease-in-out infinite; }
.arrival__bow {
  width: clamp(90px, 10vw, 170px);
  right: 8%; top: 16%;
  opacity: 0.55;
  animation: gentle-float 9s var(--ease-soft) infinite;
  filter: drop-shadow(0 14px 30px rgba(0, 0, 0, 0.7));
}
.arrival__pine { width: clamp(190px, 24vw, 380px); opacity: 0.62; }
.arrival__pine--left { left: -5%; bottom: -13%; transform: rotate(-24deg); }
.arrival__pine--right { right: -7%; bottom: -18%; transform: rotate(28deg) scale(1.2); opacity: 0.4; }

.arrival__key { display: flex; flex-direction: column; align-items: center; gap: 0.9rem; text-align: center; }
.arrival__key .plate { width: clamp(190px, 20vw, 300px); aspect-ratio: 1; }
/* The key is a small secret: hold it and it tells you why I came so early.
   Its photographic white haze is kept deliberately faint, so the night shows
   through instead of reading as a bright square. */
.arrival__key-plate {
  padding: 0; overflow: hidden;
  opacity: 0.82;
  transition: transform 0.9s var(--ease-soft), opacity 0.9s var(--ease-soft), filter 0.9s var(--ease-soft);
}
.arrival__key-plate img {
  -webkit-mask-image: radial-gradient(ellipse 82% 82% at 50% 48%, #000 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%);
  mask-image: radial-gradient(ellipse 82% 82% at 50% 48%, #000 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%);
}
.arrival__key-plate:hover, .arrival__key-plate.is-held {
  transform: rotate(-4deg) scale(1.025);
  opacity: 0.94;
  filter: drop-shadow(0 22px 44px rgba(0, 0, 0, 0.68));
}
.arrival__key .act-numeral { font-size: 0.58rem; letter-spacing: 0.3em; }
.arrival__key p { margin: 0; font-family: var(--font-elegant); font-size: 1.12rem; color: var(--ink-soft); }
.arrival__key .film-btn { margin-top: 0.4rem; }

@media (max-width: 900px) {
  .arrival__bow { display: none; }
  .arrival__pine--right { display: none; }
  .arrival__pine--left { width: 200px; opacity: 0.4; }
  .arrival__key .plate { width: clamp(150px, 38vw, 220px); }
  .arrival__key p { font-size: 0.95rem; }
}
@media (max-width: 480px) {
  .arrival__key { gap: 0.55rem; }
  .arrival__key .plate { width: 140px; }
}
</style>
