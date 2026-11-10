<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import { MUSIC_BOX } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'
import { useAudio } from '../composables/useAudio.js'
import { useMusicBoxAudio } from '../composables/useMusicBoxAudio.js'

/**
 * ACT III's physical music box. Five states, one GSAP timeline at a time:
 *   closed → opening → open (playing / paused) → closing → closed
 * The lid is the one moving part: it rotates about a real hinge axis. The
 * open box rests on its own transparent photograph alone — the ballerina and
 * winding-key cut-outs were removed, and the open plate already carries its
 * own interior (snowy town, figurine and key drawn in). No continuous
 * spinning, so the box reads as a quiet object, not a widget.
 */
const { state } = useExperience()
const globalAudio = useAudio()
const box = useMusicBoxAudio(globalAudio)

const phase = ref('closed')          // 'closed' | 'opening' | 'open' | 'closing'
const hovered = ref(false)
const reduced = computed(() => state.reducedMotion)

const root = ref(null)
const object = ref(null)
const closedEl = ref(null)
const openEl = ref(null)
const lidEl = ref(null)
const glowEl = ref(null)
const playerEl = ref(null)

const progress = computed(() => {
  const d = box.duration.value
  return d > 0 ? Math.min(1, box.currentTime.value / d) : 0
})
const isOpen = computed(() => phase.value === 'opening' || phase.value === 'open')
const isPlaying = computed(() => box.isPlaying.value)

let timeline = null
let cameraTween = null
let sceneBg = null

/* --- camera push-in --------------------------------------------------- */
/* scenes.css composes --push into the parallax transform, so the pointer
   camera keeps working while GSAP tweens only this one custom property. */
function camera(toOpen) {
  if (!sceneBg) sceneBg = root.value?.closest('.scene')?.querySelector('.scene__background') || null
  cameraTween?.kill()
  if (!sceneBg || reduced.value) {
    if (sceneBg) gsap.set(sceneBg, { '--push': toOpen ? 1.045 : 1 })
    return
  }
  // fromTo with explicit endpoints: a bare .to() on a custom property can
  // begin at 0, which collapses the whole photographic plate on frame one.
  const from = toOpen ? 1 : 1.045
  const to = toOpen ? 1.045 : 1
  cameraTween = gsap.fromTo(sceneBg,
    { '--push': from },
    { '--push': to, duration: toOpen ? 1.7 : 1.2, ease: 'power2.inOut' })
}

function settleOpen() {
  phase.value = 'open'
  gsap.set([closedEl.value, lidEl.value], { autoAlpha: 0 })
  gsap.set([openEl.value, glowEl.value, playerEl.value], { autoAlpha: 1 })
}

function settleClosed() {
  phase.value = 'closed'
  gsap.set([closedEl.value], { autoAlpha: 1 })
  gsap.set([openEl.value, lidEl.value, glowEl.value, playerEl.value], { autoAlpha: 0 })
  gsap.set(lidEl.value, { rotateX: 0 })
  // Drop the inline transform the closing timeline left behind, otherwise it
  // outranks `.mb.is-hovered .mb__object` and the hover response never shows.
  if (object.value) gsap.set(object.value, { clearProps: 'transform' })
}

function openBox() {
  if (phase.value !== 'closed') return
  timeline?.kill()
  // Preload metadata on this real gesture so the player can show 3:04 before
  // the first Play. Nothing is played here — no autoplay.
  box.ensure()
  phase.value = 'opening'
  hovered.value = false
  camera(true)

  if (reduced.value) { settleOpen(); return }

  timeline = gsap.timeline({ onComplete: settleOpen })
  timeline
    // 1. the object leans into the lens, the camera leans with it
    .to(object.value, { scale: 1.12, duration: 1.6, ease: 'power2.inOut' }, 0)
    // 2. the lid rotates backwards around its hinge, revealing the interior
    .set(lidEl.value, { autoAlpha: 1, rotateX: 0 }, 0)
    .to(lidEl.value, { rotateX: -108, duration: 1.35, ease: 'power2.inOut' }, 0.12)
    .to(lidEl.value, { autoAlpha: 0, duration: 0.5, ease: 'power1.in' }, 1.02)
    // 3. the closed shell dissolves into the open configuration
    .to(closedEl.value, { autoAlpha: 0, duration: 0.85, ease: 'power1.inOut' }, 0.28)
    .fromTo(openEl.value, { autoAlpha: 0, scale: 0.985 },
      { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power2.out' }, 0.42)
    // 4. warm interior light, then the three little figures take their places
    .fromTo(glowEl.value, { autoAlpha: 0, scale: 0.8 },
      { autoAlpha: 1, scale: 1, duration: 1.15, ease: 'power2.out' }, 0.62)
    // 5. the player arrives last, so the object stays the focus
    .fromTo(playerEl.value, { autoAlpha: 0, y: 16 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 1.12)
}

function closeBox() {
  if (phase.value === 'closed' || phase.value === 'closing') return
  timeline?.kill()
  phase.value = 'closing'
  // Fade the record out; the audio composable keeps the playhead where it is.
  if (box.isPlaying.value) box.pause()
  camera(false)

  if (reduced.value) { settleClosed(); return }

  timeline = gsap.timeline({ onComplete: settleClosed })
  timeline
    .to(playerEl.value, { autoAlpha: 0, y: 12, duration: 0.35, ease: 'power1.in' }, 0)
    .to(glowEl.value, { autoAlpha: 0, duration: 0.7, ease: 'power1.in' }, 0.05)
    .set(lidEl.value, { autoAlpha: 1, rotateX: -108 }, 0.35)
    .to(openEl.value, { autoAlpha: 0, duration: 0.65, ease: 'power1.inOut' }, 0.32)
    .to(closedEl.value, { autoAlpha: 1, duration: 0.75, ease: 'power1.inOut' }, 0.42)
    .to(lidEl.value, { rotateX: 0, duration: 1.05, ease: 'power2.inOut' }, 0.42)
    .to(object.value, { scale: 1, duration: 1.2, ease: 'power2.inOut' }, 0.1)
}

/** Leaving ACT III must not leave a record playing or a tween running. */
function forceClose() {
  timeline?.kill(); timeline = null
  cameraTween?.kill(); cameraTween = null
  if (box.isPlaying.value) box.pause()
  if (sceneBg) gsap.set(sceneBg, { '--push': 1 })
  settleClosed()
}

/* --- player ------------------------------------------------------------ */
function onPlay() { box.toggle() }
function onSeek(e) { box.seek(Number(e.target.value)) }
function onVolume(e) { box.setVolume(Number(e.target.value)) }

function onKey(e) {
  if (e.key === 'Escape' && isOpen.value) closeBox()
}

watch(() => state.activeAct, (now, was) => {
  if (was === 2 && now !== 2) forceClose()
})

onMounted(() => {
  sceneBg = root.value?.closest('.scene')?.querySelector('.scene__background') || null
  if (sceneBg) gsap.set(sceneBg, { '--push': 1 })
  settleClosed()
  window.addEventListener('keydown', onKey)
  // Separate acceptance handle: child components mount before App.vue sets up
  // window.__christmas, so this one registers itself.
  window.__musicBox = { phase, box, openBox, closeBox }
})

onUnmounted(() => {
  delete window.__musicBox
  window.removeEventListener('keydown', onKey)
  timeline?.kill()
  cameraTween?.kill()
  box.dispose()
  if (sceneBg) gsap.set(sceneBg, { '--push': 1 })
})

/* Exposed for the acceptance harness. */
defineExpose({ phase, openBox, closeBox, box })
</script>

<template>
  <div
    ref="root"
    class="mb"
    :class="{
      'is-closed': phase === 'closed',
      'is-open': isOpen,
      'is-playing': isPlaying,
      'is-hovered': hovered && phase === 'closed',
      'is-reduced': reduced,
    }"
    :data-phase="phase"
  >
    <div
      ref="object"
      class="mb__object"
      @mouseenter="hovered = true"
      @mouseleave="hovered = false"
    >
      <div class="mb__shadow" aria-hidden="true"></div>
      <div ref="glowEl" class="mb__glow" aria-hidden="true"></div>

      <!-- OPEN state: the real transparent photograph, kept intact as the
           visual reference for the whole open configuration. -->
      <img ref="openEl" class="mb__open" :src="MUSIC_BOX.open" alt="" draggable="false" />

      <!-- The independent lid rotates about a real hinge axis. -->
      <img ref="lidEl" class="mb__lid mb__knockout" :src="MUSIC_BOX.lid" alt="" draggable="false" />

      <!-- CLOSED state, and the single click target for the whole object. -->
      <img ref="closedEl" class="mb__closed mb__knockout" :src="MUSIC_BOX.closed" alt="" draggable="false" />
      <button
        v-if="phase === 'closed'"
        class="mb__touch"
        aria-label="打开圣诞音乐盒"
        title="轻点，打开这只音乐盒"
        @click="openBox"
      ></button>

      <div class="mb__sparks" aria-hidden="true">
        <i v-for="n in 7" :key="n" :style="{ '--i': n }"></i>
      </div>
    </div>

    <p class="mb__hint" v-if="phase === 'closed'">一只没上弦的音乐盒 · 轻点打开</p>

    <!-- Always in the DOM: GSAP owns autoAlpha, so the opening timeline can
         address it synchronously without waiting for a Vue tick. -->
    <section class="mb__player" ref="playerEl" :aria-hidden="!isOpen" aria-label="音乐盒播放器">
        <div class="mb__player-head">
          <span class="act-numeral">NOW PLAYING · A LITTLE MUSIC BOX</span>
          <button class="mb__close" aria-label="合上音乐盒" @click="closeBox">×</button>
        </div>

        <h3 class="mb__title">SNOWFLAKES &amp; UNSPOKEN LOVE</h3>
        <p class="mb__subtitle">A little melody hidden in a winter night.</p>

        <div class="mb__transport">
          <button class="mb__play" :aria-label="isPlaying ? '暂停' : '播放'" @click="onPlay">
            <span v-if="isPlaying" class="mb__pause-icon"></span>
            <span v-else class="mb__play-icon"></span>
          </button>
          <div class="mb__timeline">
            <input
              class="mb__seek"
              type="range" min="0" :max="box.duration.value || 1" step="0.1"
              :value="box.currentTime.value"
              :style="{ '--pct': (progress * 100).toFixed(2) + '%' }"
              aria-label="播放进度"
              @input="onSeek"
            />
            <div class="mb__times">
              <span>{{ box.formatTime(box.currentTime.value) }}</span>
              <span>{{ box.formatTime(box.duration.value) }}</span>
            </div>
          </div>
        </div>

        <label class="mb__volume">
          <span>VOLUME</span>
          <input type="range" min="0" max="1" step="0.01" :value="box.volume.value" aria-label="音量" @input="onVolume" />
        </label>
    </section>
  </div>
</template>

<style scoped>
.mb__defs { position: absolute; width: 0; height: 0; overflow: hidden; }

.mb {
  position: absolute;
  right: clamp(4rem, 18vw, 16rem);
  bottom: calc(var(--letterbox) + 10vh);
  width: clamp(190px, 18vw, 268px);
  z-index: 9;
  pointer-events: auto;
}
.mb__object {
  position: relative;
  width: 100%;
  aspect-ratio: 2240 / 2048;
  /* Perspective lives here, not on .mb: a perspective ancestor would become
     the containing block for the mobile player's fixed positioning. Only
     perspective is needed — preserve-3d on a transformed full-screen ancestor
     makes headless compositors flatten the whole foreground into a texture. */
  perspective: 1000px;
  transition: transform 0.75s var(--ease-soft);
  will-change: transform;
}
.mb.is-hovered .mb__object { transform: translateY(-5px) scale(1.025); }

/* Four of the five photographs arrived on white. A real alpha channel is
   derived once from their own pixels (scripts/derive_musicbox_alpha.py), so
   at runtime they are plain transparent images: no blend mode, no SVG filter,
   and the 3D lid transform stays a cheap, stable compositor operation. */

.mb__object > img {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: fill;
  user-select: none; -webkit-user-select: none;
  pointer-events: none;
}
/* The open photograph is already transparent and carries its own interior
   (snowy town, the little figurine and key drawn in), so no extra cut-out
   layers are needed on top — the lid is the only moving part. */
.mb__open { z-index: 2; }

.mb__closed {
  z-index: 6;
  /* The product shot has a pale studio tabletop under the box. Fade its last
     few percent away so the object settles into snow instead of a white slab. */
  -webkit-mask-image: linear-gradient(180deg, #000 0 84%, rgba(0, 0, 0, 0.5) 93%, transparent 100%);
  mask-image: linear-gradient(180deg, #000 0 84%, rgba(0, 0, 0, 0.5) 93%, transparent 100%);
}
.mb__lid {
  z-index: 5;
  /* Only the top face is the lid; the hinge sits along its lower edge. */
  -webkit-clip-path: polygon(10% 19%, 88% 14%, 97% 57%, 3% 60%);
  clip-path: polygon(10% 19%, 88% 14%, 97% 57%, 3% 60%);
  -webkit-mask-image: radial-gradient(ellipse 48% 27% at 50% 38%, #000 62%, transparent 100%);
  mask-image: radial-gradient(ellipse 48% 27% at 50% 38%, #000 62%, transparent 100%);
  transform-origin: 50% 59%;
  backface-visibility: hidden;
}

.mb__glow {
  position: absolute; z-index: 1;
  left: 8%; top: 2%; width: 84%; height: 72%;
  border-radius: 50%;
  background:
    radial-gradient(ellipse 46% 44% at 50% 48%, rgba(255, 218, 150, 0.44), rgba(255, 186, 96, 0.14) 58%, transparent 78%),
    radial-gradient(ellipse 60% 52% at 50% 60%, rgba(255, 200, 120, 0.18), transparent 72%);
  filter: blur(9px);
  pointer-events: none;
}
.mb.is-playing .mb__glow { animation: mb-glow-pulse 4.6s var(--ease-soft) infinite alternate; }
@keyframes mb-glow-pulse { from { opacity: 0.72; } to { opacity: 1; } }

.mb__shadow {
  position: absolute; z-index: 0;
  left: 6%; bottom: -3%; width: 88%; height: 13%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.62), transparent 72%);
  filter: blur(7px);
  pointer-events: none;
}

.mb__sparks { position: absolute; inset: 0; z-index: 7; pointer-events: none; opacity: 0; transition: opacity 1.1s var(--ease-soft); }
.mb.is-playing .mb__sparks { opacity: 1; }
.mb__sparks i {
  position: absolute;
  left: calc(24% + var(--i) * 8.2%);
  top: calc(20% + (var(--i) * 13 % 46) * 1%);
  width: 3px; height: 3px; border-radius: 50%;
  background: radial-gradient(circle, #fff3d4 0%, rgba(255, 214, 140, 0.7) 45%, transparent 75%);
  box-shadow: 0 0 7px 2px rgba(255, 206, 130, 0.38);
  animation: mb-spark 3.4s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.47s);
}
@keyframes mb-spark {
  0%, 100% { opacity: 0.18; transform: translateY(3px) scale(0.7); }
  45% { opacity: 0.92; transform: translateY(-5px) scale(1.15); }
}

.mb__touch {
  position: absolute; inset: 0; z-index: 8;
  border: 0; background: transparent; cursor: pointer;
  border-radius: 40%;
}
.mb__hint {
  margin: 0.85rem 0 0; text-align: center;
  font-family: var(--font-cn); font-size: 0.6rem; letter-spacing: 0.12em;
  color: rgba(232, 200, 138, 0.72); white-space: nowrap;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
  transition: color 0.5s;
}
.mb.is-hovered .mb__hint { color: var(--gold-300); }

/* ---- the minimal player ---------------------------------------------- */
.mb__player {
  position: absolute;
  bottom: calc(100% + 1.1rem);
  right: -6%;
  width: min(310px, 32vw);
  padding: 1.05rem 1.2rem 1.15rem;
  border: 1px solid rgba(232, 200, 138, 0.26);
  border-radius: 18px;
  background: linear-gradient(155deg, rgba(20, 27, 43, 0.78), rgba(6, 9, 17, 0.86));
  backdrop-filter: blur(22px) saturate(1.25);
  -webkit-backdrop-filter: blur(22px) saturate(1.25);
  box-shadow: 0 22px 60px rgba(0, 0, 0, 0.62);
}
.mb__player-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.mb__player-head .act-numeral { font-size: 0.48rem; letter-spacing: 0.16em; white-space: nowrap; }
.mb__close { font-size: 1.25rem; line-height: 1; color: var(--ink-faint); padding: 0 0.15rem; }
.mb__close:hover { color: var(--gold-100); }
.mb__title {
  margin: 0.95rem 0 0; font-family: var(--font-display);
  font-size: 0.76rem; letter-spacing: 0.16em; color: var(--gold-100);
  white-space: nowrap;
}
.mb__subtitle {
  margin: 0.32rem 0 0; font-family: var(--font-elegant); font-style: italic;
  font-size: 0.72rem; letter-spacing: 0.04em; color: var(--ink-faint);
}
.mb__transport { display: flex; align-items: center; gap: 0.85rem; margin-top: 1.1rem; }
.mb__play {
  flex: 0 0 36px; width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid rgba(232, 200, 138, 0.42);
  background: radial-gradient(circle at 35% 30%, rgba(232, 200, 138, 0.18), rgba(6, 10, 20, 0.8));
  display: grid; place-items: center;
  transition: border-color 0.35s, box-shadow 0.35s, transform 0.35s;
}
.mb__play:hover { border-color: var(--gold-100); transform: scale(1.07); box-shadow: 0 0 18px rgba(232, 200, 138, 0.28); }
.mb__play-icon {
  display: block; width: 0; height: 0; margin-left: 3px;
  border-left: 9px solid var(--gold-100);
  border-top: 6px solid transparent; border-bottom: 6px solid transparent;
}
.mb__pause-icon {
  display: block; width: 9px; height: 12px;
  border-left: 3px solid var(--gold-100); border-right: 3px solid var(--gold-100);
}
.mb__timeline { flex: 1; min-width: 0; }
.mb__seek {
  width: 100%; height: 2px; margin: 0; display: block;
  appearance: none; -webkit-appearance: none; cursor: pointer; outline: none;
  background: linear-gradient(90deg, var(--gold-300) var(--pct), rgba(232, 200, 138, 0.16) var(--pct));
  border-radius: 999px;
}
.mb__seek::-webkit-slider-thumb {
  appearance: none; -webkit-appearance: none;
  width: 9px; height: 9px; border-radius: 50%;
  background: var(--gold-100); box-shadow: 0 0 8px var(--gold-300);
}
.mb__seek::-moz-range-thumb {
  width: 9px; height: 9px; border: 0; border-radius: 50%;
  background: var(--gold-100); box-shadow: 0 0 8px var(--gold-300);
}
.mb__times {
  display: flex; justify-content: space-between; margin-top: 0.5rem;
  font-family: var(--font-display); font-size: 0.52rem; letter-spacing: 0.12em;
  color: var(--ink-faint);
}
.mb__volume {
  display: flex; align-items: center; gap: 0.8rem; margin-top: 1rem;
  padding-top: 0.85rem; border-top: 1px solid rgba(232, 200, 138, 0.14);
}
.mb__volume > span {
  font-family: var(--font-display); font-size: 0.5rem;
  letter-spacing: 0.2em; color: var(--ink-faint); white-space: nowrap;
}
.mb__volume input {
  flex: 1; height: 2px; appearance: none; -webkit-appearance: none;
  cursor: pointer; outline: none; border-radius: 999px;
  background: linear-gradient(90deg, var(--gold-500), rgba(232, 200, 138, 0.16));
}
.mb__volume input::-webkit-slider-thumb {
  appearance: none; -webkit-appearance: none;
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--gold-100);
}
.mb__volume input::-moz-range-thumb {
  width: 10px; height: 10px; border: 0; border-radius: 50%; background: var(--gold-100);
}
.mb-player-enter-active, .mb-player-leave-active { transition: opacity 0.5s var(--ease-soft), transform 0.5s var(--ease-film); }
.mb-player-enter-from, .mb-player-leave-to { opacity: 0; transform: translateY(12px); }

@media (max-width: 900px) {
  .mb { right: 4%; bottom: calc(var(--letterbox) + 24vh); width: clamp(140px, 27vw, 200px); }
  .mb__player { right: 0; width: min(290px, 62vw); }
  .mb__hint { font-size: 0.52rem; }
}
@media (max-width: 480px) {
  .mb { right: 9%; bottom: calc(var(--letterbox) + 30vh); width: 126px; }
  .mb__hint { display: none; }
  /* The .scene foreground is the nearest transformed ancestor, so fixed is
     viewport-wide here; perspective was moved off .mb to make that true. */
  .mb__player {
    position: fixed;
    left: 1rem; right: 1rem; top: auto;
    bottom: calc(var(--letterbox) + 4.2rem);
    width: auto; padding: 0.8rem 0.95rem 0.9rem;
    border-radius: 16px;
  }
  .mb__player-head .act-numeral { font-size: 0.44rem; }
  .mb__title { margin-top: 0.7rem; font-size: 0.68rem; letter-spacing: 0.1em; }
  .mb__subtitle { margin-top: 0.25rem; font-size: 0.62rem; white-space: nowrap; }
  .mb__transport { margin-top: 0.75rem; }
  .mb__volume { margin-top: 0.7rem; padding-top: 0.6rem; }
}
@media (prefers-reduced-motion: reduce) {
  .mb__object { transition: none; }
  .mb.is-playing .mb__glow, .mb__sparks i { animation: none; }
  .mb__sparks { display: none; }
  .mb-player-enter-active, .mb-player-leave-active { transition-duration: 0.01s; }
}
</style>
