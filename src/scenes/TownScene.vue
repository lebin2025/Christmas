<script setup>
import { ref } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import { SCENES, PLATES, OVERLAYS, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { goToAct, almostSay } = useExperience()
const lightsOn = ref(false)

function toggleLights() {
  lightsOn.value = !lightsOn.value
  // A silhouette at the window, and a line I immediately look away from.
  if (lightsOn.value) almostSay('我看见你的影子，立刻低下了头。')
}
</script>

<template>
  <SceneShell
    :index="1"
    :image="SCENES.town"
    numeral="II"
    kicker="ACT II"
    eyebrow="EVERY WINDOW BUT YOURS"
    title="CHRISTMAS TOWN"
    subtitle="街那么长，我只敢看一扇窗"
    lede="每扇窗都亮着，像有人正等着谁。我经过最亮的那一扇，没敢抬头。"
    hint="LIGHT THE WINDOWS · LOOK AWAY"
    object-position="50% 46%"
    light-position="left: 42%; top: 6%;"
  >
    <template #atmosphere>
      <img class="atmo atmo--fog" :src="OVERLAYS.fog" alt="" />
      <img class="atmo town__bokeh" :src="OVERLAYS.bokeh" alt="" />
      <div class="town__glow" :class="{ 'is-lit': lightsOn }"></div>
      <div class="town__shadow" :class="{ 'is-seen': lightsOn }"></div>
    </template>

    <template #mid>
      <div class="depth-object town__wreath" :style="{ '--tilt': '0deg' }">
        <img :src="CUTOUTS.wreath" alt="" />
      </div>
      <div class="depth-object town__bell" :style="{ '--tilt': '4deg' }">
        <img :src="CUTOUTS.bell" alt="" />
      </div>
    </template>

    <template #default>
      <button class="chip town__switch" :class="{ 'is-on': lightsOn }" @click="toggleLights">
        {{ lightsOn ? '✦  灯亮了，我退开半步' : '✧  替你点亮窗火' }}
      </button>
    </template>

    <template #interaction>
      <div class="town__post">
        <div class="plate town__postcard">
          <img :src="PLATES.envelope" alt="一封带火漆封印的信" />
        </div>
        <span class="act-numeral">POSTE · NOËL</span>
        <p>有些话，趁雪还没停，寄给不相干的人。</p>
        <button class="film-btn" @click="goToAct(4)">
          <span class="film-btn__dot"></span>WRITE A LETTER
        </button>
      </div>
    </template>

    <template #foreground>
      <div class="depth-object town__pine town__pine--left"><img :src="CUTOUTS.pine" alt="" /></div>
      <div class="depth-object town__pine town__pine--right"><img :src="CUTOUTS.pine" alt="" /></div>
    </template>
  </SceneShell>
</template>

<style scoped>
.town__bokeh { opacity: 0.055; animation: slow-drift 26s ease-in-out infinite; }
.town__glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 30% 40% at 18% 55%, rgba(255, 178, 82, 0.42), transparent 70%),
    radial-gradient(ellipse 30% 42% at 82% 50%, rgba(255, 190, 100, 0.38), transparent 70%),
    radial-gradient(ellipse 50% 30% at 50% 78%, rgba(255, 170, 70, 0.22), transparent 72%);
  mix-blend-mode: screen;
  opacity: 0.12;
  transition: opacity 1.5s var(--ease-soft);
}
.town__glow.is-lit { opacity: 0.92; }

/* Someone is standing at the lit window. Only for a moment, then gone. */
.town__shadow {
  position: absolute; left: 71%; top: 41%;
  width: clamp(26px, 3.6vw, 54px); height: clamp(62px, 8.5vw, 124px);
  border-radius: 46% 46% 20% 20% / 36% 36% 12% 12%;
  background: radial-gradient(ellipse at 50% 28%, rgba(9, 7, 13, 0.92), rgba(9, 7, 13, 0.5) 62%, transparent 82%);
  box-shadow: 0 0 26px rgba(255, 190, 110, 0.2);
  filter: blur(6px); opacity: 0; pointer-events: none;
  transform: translateX(-50%);
}
.town__shadow.is-seen { animation: shadow-glance 2.6s var(--ease-soft) 1; }
@keyframes shadow-glance {
  0% { opacity: 0; transform: translateX(-50%) translateY(7px); }
  28% { opacity: 0.62; transform: translateX(-50%) translateY(0); }
  64% { opacity: 0.4; }
  100% { opacity: 0; transform: translateX(-42%) translateY(-3px); }
}

.town__wreath {
  width: clamp(100px, 11vw, 175px);
  right: 3%; top: 3%;
  animation: gentle-float 11s var(--ease-soft) infinite;
  filter: drop-shadow(0 16px 34px rgba(0, 0, 0, 0.8));
}
.town__bell {
  width: clamp(70px, 8vw, 120px);
  left: 5%; bottom: 7%;
  animation: gentle-float 8s var(--ease-soft) infinite -3s;
  filter: drop-shadow(0 12px 26px rgba(0, 0, 0, 0.75));
}
.town__switch { margin-top: 1.8rem; }

.town__post { display: flex; flex-direction: column; align-items: center; gap: 0.85rem; text-align: center; }
.town__postcard {
  width: clamp(180px, 20vw, 290px); aspect-ratio: 1;
  transform: rotate(-3deg);
  filter: drop-shadow(0 22px 44px rgba(0, 0, 0, 0.72)) sepia(0.15) brightness(0.84) contrast(1.05);
  transition: transform 0.8s var(--ease-soft), filter 0.8s var(--ease-soft);
}
.town__postcard:hover { transform: rotate(0deg) translateY(-6px); }
.town__post .act-numeral { font-size: 0.58rem; letter-spacing: 0.3em; }
.town__post p { margin: 0; font-family: var(--font-elegant); font-size: 1.1rem; color: var(--ink-soft); }

.town__pine { width: clamp(180px, 22vw, 340px); opacity: 0.55; }
.town__pine--left { left: -9%; bottom: -16%; transform: rotate(-34deg); }
.town__pine--right { right: -10%; bottom: -20%; transform: rotate(38deg) scale(1.25); opacity: 0.38; }

@media (max-width: 900px) {
  .town__wreath, .town__bell, .town__pine--right { display: none; }
  .town__pine--left { width: 190px; opacity: 0.36; }
  .town__postcard { width: clamp(140px, 42vw, 230px); }
  .town__post p { font-size: 0.95rem; }
  .town__switch { margin-top: 1.1rem; }
}
@media (max-width: 480px) {
  .town__postcard { width: 145px; }
  .town__post { gap: 0.5rem; }
}
</style>
