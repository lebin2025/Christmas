<script setup>
import { ref, computed } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import { SCENES, OVERLAYS, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'
import { useAudio } from '../composables/useAudio.js'

const { state, goToAct, almostSay } = useExperience()
const audio = useAudio()
const selected = ref(null)

const stars = computed(() => state.wishes.slice(0, 14).map((w, i, arr) => {
  const t = arr.length > 1 ? i / (arr.length - 1) : 0.5
  return {
    ...w,
    left: `${14 + t * 72}%`,
    top: `${30 + Math.sin(i * 2.3) * 12 + (i % 3) * 5}%`,
    delay: `${(i * 0.31) % 3}s`,
  }
}))

function pick(w) { selected.value = selected.value?.id === w.id ? null : w }
/* Reading the line aloud was one step too far — take it back. */
function takeBack() {
  almostSay('算了，明年再说。')
  selected.value = null
}
function home() { goToAct(0) }
function replay() { audio.restart(); goToAct(0) }
</script>

<template>
  <SceneShell
    :index="5"
    :image="SCENES.finale"
    numeral="VI"
    stage-class="scene__stage--full"
    centered
    object-position="50% 46%"
    light-position="left: 28%; top: -8%;"
  >
    <template #stage>
      <div class="finale-stage">
        <div class="finale__head js-reveal">
          <span class="act-numeral">ACT VI &nbsp;·&nbsp; WHAT WAS LEFT UNSAID</span>
          <p class="eyebrow">THE WORDS STAY</p>
          <h2 class="scene-title js-title">A NIGHT TO REMEMBER<em>灯会熄，那句话还亮着</em></h2>
          <p class="scene-lede final__lede">你走过雪街，替一扇窗点了灯，把一句话折进信封。它没有寄出，却陪我们过完了整个冬天。</p>
          <div class="gold-rule"></div>
        </div>

        <div class="finale__starfield" aria-label="收好的那些没说出口的话">
          <button
            v-for="s in stars"
            :key="s.id"
            class="finale__wish"
            :class="{ 'is-picked': selected?.id === s.id }"
            :style="{ left: s.left, top: s.top, animationDelay: s.delay }"
            :title="s.text"
            :aria-label="`那句话：${s.text}`"
            @click="pick(s)"
          >✦</button>
          <span class="finale__starfield-empty" v-if="!stars.length">还没有一句话，敢落在雪上</span>
        </div>

        <transition name="wish">
          <button class="finale__selected" v-if="selected" @click="takeBack">
            「 {{ selected.text }} 」<small>轻点，把这句话收回来</small>
          </button>
        </transition>

        <div class="finale__foot js-reveal">
          <span class="cn-line">MERRY CHRISTMAS &nbsp;·&nbsp; 圣诞快乐</span>
          <div class="finale__buttons">
            <button class="film-btn" @click="home"><span class="film-btn__dot"></span>RETURN TO THE BEGINNING</button>
            <button class="film-btn" @click="replay">↺ &nbsp;REPLAY WITH MUSIC</button>
          </div>
          <button class="finale__letter-link" @click="goToAct(4)">把没说的那句，再写一遍 →</button>
        </div>
      </div>
    </template>

    <template #atmosphere>
      <img class="atmo finale__bokeh" :src="OVERLAYS.bokeh" alt="" />
      <img class="atmo finale__dust" :src="OVERLAYS.goldenDust" alt="" />
      <img class="atmo atmo--fog" :src="OVERLAYS.fog" alt="" />
    </template>

    <template #mid>
      <div class="finale__topstar"><img :src="CUTOUTS.goldenStar" alt="" /></div>
      <div class="finale__plate"><img :src="CUTOUTS.star" alt="" /></div>
    </template>

    <template #foreground>
      <div class="depth-object finale__pine finale__pine--left"><img :src="CUTOUTS.pine" alt="" /></div>
      <div class="depth-object finale__pine finale__pine--right"><img :src="CUTOUTS.pine" alt="" /></div>
      <div class="depth-object finale__bell"><img :src="CUTOUTS.bell" alt="" /></div>
    </template>
  </SceneShell>
</template>

<style scoped>
.finale-stage { position: absolute; inset: 0; }
.finale__head { position: absolute; top: 9vh; left: 0; right: 0; }
.final__lede { margin: 1.3rem auto 0; max-width: 42ch; }
.finale__head .gold-rule { margin: 1.5rem auto 0; }

.finale__bokeh { opacity: 0.06; animation: slow-drift 28s ease-in-out infinite; }
.finale__dust { opacity: 0.09; animation: slow-drift 20s ease-in-out infinite reverse; }

.finale__starfield { position: absolute; left: 0; right: 0; top: 30%; height: 40%; }
.finale__wish {
  position: absolute; transform: translate(-50%, -50%);
  font-size: clamp(0.7rem, 1.1vw, 1.15rem);
  color: var(--gold-100); text-shadow: 0 0 14px rgba(255, 214, 140, 0.9), 0 0 34px rgba(255, 180, 80, 0.55);
  animation: twinkle 3.4s var(--ease-soft) infinite;
  padding: 0.35rem;
  transition: color 0.4s, transform 0.4s;
}
.finale__wish:hover, .finale__wish.is-picked { color: #fffaf0; transform: translate(-50%, -50%) scale(1.7); }
.finale__starfield-empty {
  position: absolute; left: 50%; top: 55%; transform: translateX(-50%);
  font-family: var(--font-elegant); font-size: 0.95rem;
  color: var(--ink-soft); white-space: nowrap;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.95);
}

.finale__selected {
  position: absolute; left: 50%; top: 68%; transform: translateX(-50%);
  display: block; margin: 0; padding: 0;
  font-family: var(--font-elegant); font-style: italic;
  font-size: clamp(1rem, 1.5vw, 1.4rem); color: var(--gold-100);
  text-shadow: 0 2px 18px rgba(0,0,0,0.9); max-width: 60ch; text-align: center;
}
.finale__selected small {
  display: block; margin-top: 0.65rem;
  font-family: var(--font-cn); font-style: normal;
  font-size: 0.56rem; letter-spacing: 0.2em;
  color: var(--ink-faint); text-shadow: none;
  transition: color 0.35s;
}
.finale__selected:hover small { color: var(--gold-300); }
.wish-enter-active, .wish-leave-active { transition: opacity 0.5s var(--ease-soft), transform 0.5s var(--ease-soft); }
.wish-enter-from, .wish-leave-to { opacity: 0; transform: translate(-50%, 10px); }

.finale__foot {
  position: absolute; bottom: 8vh; left: 0; right: 0;
  display: flex; flex-direction: column; align-items: center; gap: 1.1rem;
}
.finale__buttons { display: flex; gap: 0.7rem; flex-wrap: wrap; justify-content: center; }
.finale__letter-link {
  font-family: var(--font-cn); font-size: 0.72rem; letter-spacing: 0.16em;
  color: rgba(232, 200, 138, 0.72);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.95);
  transition: color 0.35s;
}
.finale__letter-link:hover { color: var(--gold-100); }

.finale__topstar {
  position: absolute; left: 50%; top: -3%; width: clamp(80px, 10vw, 150px);
  transform: translateX(-50%); opacity: 0.45;
  filter: drop-shadow(0 0 28px rgba(255, 202, 120, 0.42));
  animation: star-pulse 5s var(--ease-soft) infinite;
}
.finale__plate {
  position: absolute; right: 5%; top: 14%; width: clamp(90px, 11vw, 165px);
  opacity: 0.32; filter: drop-shadow(0 0 24px rgba(255, 202, 120, 0.4));
  animation: gentle-float 12s var(--ease-soft) infinite;
}
.finale__plate img { width: 100%; }

.finale__pine { width: clamp(190px, 23vw, 360px); opacity: 0.5; }
.finale__pine--left { left: -8%; bottom: -18%; transform: rotate(-28deg); }
.finale__pine--right { right: -9%; bottom: -22%; transform: rotate(32deg) scale(1.2); opacity: 0.34; }
.finale__bell { width: clamp(70px, 8vw, 130px); left: 9%; top: 22%; opacity: 0.55; animation: gentle-float 10s var(--ease-soft) infinite; }

@media (max-width: 900px) {
  .finale__head { top: 10vh; }
  .final__lede { font-size: 0.95rem; max-width: 30ch; }
  .finale__foot { bottom: 6vh; gap: 0.7rem; }
  .finale__plate, .finale__bell, .finale__pine--right { display: none; }
  .finale__pine--left { width: 170px; opacity: 0.3; }
  .finale__starfield { top: 32%; height: 34%; }
  .finale__selected { top: 70%; }
}
@media (max-width: 480px) {
  .finale__head { top: 10vh; }
  .finale__buttons { flex-direction: column; }
  .finale__foot { bottom: 5vh; }
  .finale__starfield-empty { font-size: 0.78rem; }
}
</style>
