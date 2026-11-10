<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAudio } from '../composables/useAudio.js'
import { useExperience } from '../composables/useExperience.js'

const { state, goToAct, draftLetter, whisper, unspokenCount, almostSay, hush } = useExperience()
const audio = useAudio()

/* Hovering unfolds the note; leaving folds it back. A click pins it open.
   A line arriving from any of the six acts opens it on its own for a beat. */
const pinned = ref(false)
const hovered = ref(false)
const dismissed = ref(false)
const open = computed(() =>
  (!dismissed.value && (pinned.value || hovered.value)) || Boolean(whisper.value))

function onEnter() { hovered.value = true }
function onLeave() { hovered.value = false; dismissed.value = false }
/* Pointing back at the orb after closing it is a fresh request to peek. */
function onOrbEnter() {
  hovered.value = true
  if (!pinned.value) dismissed.value = false
}
function onFocusIn() { hovered.value = true }
function onFocusOut(e) {
  if (e.currentTarget.contains(e.relatedTarget)) return
  hovered.value = false
}
function onOrbClick() {
  if (pinned.value) {
    pinned.value = false
    dismissed.value = true
  } else {
    pinned.value = true
    dismissed.value = false
  }
}
function onClose() { pinned.value = false; dismissed.value = true; hush() }

/* Three lines never said aloud. */
const VERSES = [
  '练习了一整个冬天，把「喜欢你」说成「今晚好冷」。',
  '你经过时我低头看雪，怕眼里的光被你看见。',
  '写了又删的那一行，最后只留下一个省略号。',
]
const verseIndex = ref(0)
const verse = computed(() => VERSES[verseIndex.value])
function nextVerse() { verseIndex.value = (verseIndex.value + 1) % VERSES.length }

/* Too shy to tell that person — so tell Christmas instead. The line is
   carried into ACT V's letter paper. */
function sendToLetter() {
  draftLetter(verse.value)
  onClose()
  goToAct(4)
}

function onVolume(e) { audio.setVolume(e.target.valueAsNumber) }
function onTogglePower() { audio.toggle() }
function onAmbience() { audio.setAmbience(!state.ambienceOn) }
function onSnow() { state.snowEnabled = !state.snowEnabled }

/* Esc folds the note away, even when it is pinned. */
function onKey(e) {
  if (e.key === 'Escape' && open.value) onClose()
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="music"
    :class="{ 'is-open': open }"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <button
      class="music__orb"
      :class="{ 'is-playing': audio.isPlaying.value, 'is-pulse': whisper }"
      :aria-label="audio.isPlaying.value ? '暂停音乐' : '播放音乐'"
      :aria-expanded="open"
      :title="'未说出口 · 双击画面，也有一句回声'"
      @mouseenter="onOrbEnter"
      @click="onOrbClick"
    >
      <span class="music__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="music__orb-label">未说出口</span>
    </button>

    <transition name="panel">
      <div class="music__panel" v-if="open" :class="{ 'is-compact': !pinned }">
        <div class="music__head">
          <span class="act-numeral">THE WORDS I NEVER SAID</span>
          <button class="music__close" aria-label="收起面板" @click="onClose">×</button>
        </div>

        <button class="music__verse" @click="nextVerse" aria-label="换一句没说出口的话">
          <transition name="verse" mode="out-in">
            <span :key="verseIndex">{{ verse }}</span>
          </transition>
          <small>雪替我保守了这个秘密 · 轻点换一句</small>
        </button>

        <!-- One line at a time: the element plays its own fade-in / fade-out
             across the same 1.8s the whisper lives, so rapid double clicks
             never stack two lines of gold ink on the note. -->
        <p class="music__whisper" v-if="whisper" :key="whisper.id">{{ whisper.text }}</p>
        <p class="music__count">第 {{ unspokenCount }} 次，把话收了回来</p>

        <div class="music__actions">
          <button class="chip" @click="almostSay()">✦ 差一点说出口</button>
          <button class="chip" @click="sendToLetter">✉ 只敢写给圣诞</button>
        </div>

        <p class="music__peek" v-if="!pinned">点一下圆钮，让今夜有声</p>

        <transition name="sound">
          <div class="music__sound" v-if="pinned">
            <div class="music__divider"></div>

            <div class="music__now">
              <span class="music__disc" :class="{ 'is-spinning': audio.isPlaying.value }"></span>
              <div>
                <p class="music__track">A Letter I Never Sent</p>
                <p class="music__sub">一封没有寄出的信 · 3:20 · loop</p>
              </div>
            </div>

            <div class="music__progress"><i :style="{ width: (audio.progress.value * 100).toFixed(1) + '%' }"></i></div>

            <div class="music__row">
              <button class="film-btn music__power" @click="onTogglePower">
                <span class="film-btn__dot"></span>
                {{ audio.isPlaying.value ? 'PAUSE' : 'PLAY MUSIC' }}
              </button>
              <button class="film-btn music__restart" aria-label="从头播放" @click="audio.restart()">↺</button>
            </div>

            <label class="music__slider">
              <span>VOLUME <b>{{ Math.round(state.volume * 100) }}%</b></span>
              <input type="range" min="0" max="1" step="0.01" :value="state.volume" @input="onVolume" />
            </label>

            <div class="music__toggles">
              <button class="chip" :class="{ 'is-on': state.ambienceOn }" @click="onAmbience">
                夜的风声 · {{ state.ambienceOn ? 'ON' : 'OFF' }}
              </button>
              <button class="chip" :class="{ 'is-on': state.snowEnabled }" @click="onSnow">
                落雪 · {{ state.snowEnabled ? 'ON' : 'OFF' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.music {
  position: fixed;
  left: clamp(1rem, 2.6vw, 2.8rem);
  bottom: calc(var(--letterbox) + 1.6rem);
  z-index: calc(var(--z-ui) + 1);
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-start;
  gap: 0.9rem;
}

.music__orb {
  position: relative;
  width: 54px; height: 54px;
  border-radius: 18px;
  border: 1px solid rgba(232, 200, 138, 0.32);
  background: radial-gradient(circle at 35% 30%, rgba(232, 200, 138, 0.16), rgba(6, 10, 20, 0.82));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 16px rgba(232, 200, 138, 0.07);
  display: grid;
  place-items: center;
  transition: border-color 0.4s, box-shadow 0.4s, transform 0.4s, border-radius 0.4s;
}
.music__orb:hover { border-color: var(--gold-300); transform: scale(1.06); box-shadow: 0 0 26px rgba(232, 200, 138, 0.22); }
.music.is-open .music__orb {
  border-color: rgba(232, 200, 138, 0.66);
  box-shadow: 0 0 32px rgba(232, 200, 138, 0.24), inset 0 0 20px rgba(232, 200, 138, 0.12);
}
/* A line arriving from another act makes the little note catch its breath. */
.music__orb.is-pulse {
  border-color: rgba(232, 200, 138, 0.85);
  animation: orb-heartbeat 1.25s var(--ease-soft) infinite;
}
@keyframes orb-heartbeat {
  0%, 100% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(232, 200, 138, 0.4); }
  50% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 13px rgba(232, 200, 138, 0); }
}
.music__orb-label {
  position: absolute; bottom: -1.15rem; left: 50%; transform: translateX(-50%);
  font-family: var(--font-cn); font-size: 0.52rem; letter-spacing: 0.14em;
  color: var(--ink-faint); white-space: nowrap;
}
.music.is-open .music__orb-label { color: var(--gold-300); }
.music__bars { display: flex; align-items: center; gap: 2px; height: 16px; }
.music__bars i {
  display: block; width: 2px; height: 5px; border-radius: 2px;
  background: var(--gold-300); opacity: 0.7;
}
.music__orb.is-playing .music__bars i { animation: eq 1.1s ease-in-out infinite alternate; }
.music__orb.is-playing .music__bars i:nth-child(1) { animation-delay: -0.2s; }
.music__orb.is-playing .music__bars i:nth-child(2) { animation-delay: -0.7s; }
.music__orb.is-playing .music__bars i:nth-child(3) { animation-delay: -0.4s; }
.music__orb.is-playing .music__bars i:nth-child(4) { animation-delay: -0.9s; }
@keyframes eq { from { height: 4px; opacity: 0.5; } to { height: 16px; opacity: 1; } }

.music__panel {
  width: min(310px, calc(100vw - 2.5rem));
  max-height: calc(100vh - 7.5rem);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(232, 200, 138, 0.28) transparent;
  padding: 1.25rem 1.35rem 1.35rem;
  border: 1px solid rgba(232, 200, 138, 0.28);
  background: linear-gradient(160deg, rgba(18, 26, 42, 0.72), rgba(6, 9, 17, 0.84));
  backdrop-filter: blur(26px) saturate(1.3);
  -webkit-backdrop-filter: blur(26px) saturate(1.3);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
  border-radius: 22px;
  transform-origin: bottom left;
}
.music__panel::-webkit-scrollbar { width: 5px; }
.music__panel::-webkit-scrollbar-thumb { background: rgba(232, 200, 138, 0.28); border-radius: 999px; }
.music__head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.music__head .act-numeral { font-size: 0.52rem; letter-spacing: 0.14em; white-space: nowrap; }
.music__close { font-size: 1.3rem; color: var(--ink-faint); line-height: 1; padding: 0 0.2rem; }
.music__close:hover { color: var(--gold-100); }

/* --- the unspoken note --- */
.music__verse {
  display: block; width: 100%; text-align: left;
  margin: 1.05rem 0 0; padding: 0.9rem 1rem;
  border: 1px solid rgba(232, 200, 138, 0.16);
  border-radius: 14px;
  background: linear-gradient(150deg, rgba(232, 200, 138, 0.07), rgba(8, 12, 22, 0.24));
  transition: border-color 0.4s, background 0.4s;
}
.music__verse:hover {
  border-color: rgba(232, 200, 138, 0.4);
  background: linear-gradient(150deg, rgba(232, 200, 138, 0.12), rgba(8, 12, 22, 0.3));
}
.music__verse > span {
  display: block;
  font-family: var(--font-cn); font-size: 0.84rem;
  line-height: 1.85; letter-spacing: 0.05em; color: var(--gold-100);
}
.music__verse small {
  display: block; margin-top: 0.5rem;
  font-family: var(--font-elegant); font-style: italic;
  font-size: 0.62rem; letter-spacing: 0.09em; color: var(--ink-faint);
}
.verse-enter-active, .verse-leave-active { transition: opacity 0.32s var(--ease-soft), transform 0.32s var(--ease-soft); }
.verse-enter-from { opacity: 0; transform: translateY(6px); }
.verse-leave-to { opacity: 0; transform: translateY(-6px); }

.music__whisper {
  margin: 0.75rem 0 0; text-align: center;
  font-family: var(--font-hand); font-style: italic;
  font-size: 0.94rem; letter-spacing: 0.06em;
  color: #ffe6bd; text-shadow: 0 0 14px rgba(255, 205, 120, 0.5);
  animation: whisper-cycle 1.8s var(--ease-soft) both;
}
@keyframes whisper-cycle {
  0%   { opacity: 0; transform: translateY(7px); }
  14%  { opacity: 1; transform: translateY(0); }
  76%  { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-6px); }
}

.music__count {
  margin: 0.5rem 0 0; text-align: center;
  font-family: var(--font-cn); font-size: 0.62rem;
  letter-spacing: 0.14em; color: var(--ink-faint);
}
.music__actions { display: flex; gap: 0.45rem; margin-top: 0.9rem; }
.music__actions .chip {
  flex: 1; justify-content: center;
  border-radius: 999px; font-size: 0.62rem; padding: 0.45rem 0.5rem;
}
/* Hovering shows only the note; clicking pins it and unfolds the sound desk. */
.music__peek {
  margin: 0.8rem 0 0.1rem; text-align: center;
  font-family: var(--font-elegant); font-style: italic;
  font-size: 0.64rem; letter-spacing: 0.12em; color: var(--ink-faint);
}
.sound-enter-active, .sound-leave-active {
  transition: opacity 0.38s var(--ease-soft), max-height 0.45s var(--ease-film);
  overflow: hidden;
}
.sound-enter-from, .sound-leave-to { opacity: 0; max-height: 0; }
.sound-enter-to, .sound-leave-from { opacity: 1; max-height: 460px; }

.music__divider {
  height: 1px; margin: 1.15rem 0 0.2rem;
  background: linear-gradient(90deg, transparent, rgba(232, 200, 138, 0.25), transparent);
}

/* --- the sound console --- */
.music__now { display: flex; align-items: center; gap: 0.9rem; margin: 0.95rem 0 0.8rem; }
.music__disc {
  width: 38px; height: 38px; flex: 0 0 38px; border-radius: 50%;
  background: repeating-radial-gradient(circle at center, #15171d 0 2px, #0a0b10 2px 4px);
  border: 1px solid rgba(232, 200, 138, 0.28);
  position: relative;
}
.music__disc::after {
  content: ''; position: absolute; inset: 38%; border-radius: 50%;
  background: var(--crimson); box-shadow: inset 0 0 0 1px rgba(232, 200, 138, 0.4);
}
.music__disc.is-spinning { animation: spin-slow 3.4s linear infinite; }
.music__track { margin: 0; font-family: var(--font-elegant); font-size: 0.98rem; white-space: nowrap; color: var(--gold-100); }
.music__sub { margin: 0.15rem 0 0; font-family: var(--font-display); font-size: 0.52rem; letter-spacing: 0.16em; color: var(--ink-faint); }

.music__progress { height: 2px; background: rgba(232, 200, 138, 0.14); overflow: hidden; border-radius: 999px; }
.music__progress i { display: block; height: 100%; background: linear-gradient(90deg, var(--gold-700), var(--gold-100)); box-shadow: 0 0 8px var(--gold-300); }

.music__row { display: flex; gap: 0.5rem; margin: 1.15rem 0; }
.music__power { flex: 1; justify-content: center; padding: 0.66rem 0.8rem; font-size: 0.58rem; letter-spacing: 0.2em; }
.music__restart { padding: 0.66rem 0.9rem; font-size: 1rem; border-radius: 999px; }

.music__slider { display: block; }
.music__slider > span {
  display: flex; justify-content: space-between;
  font-family: var(--font-display); font-size: 0.55rem; letter-spacing: 0.2em; color: var(--ink-faint);
  margin-bottom: 0.5rem;
}
.music__slider b { color: var(--gold-300); font-weight: 400; }
.music__slider input {
  width: 100%; height: 2px; appearance: none; -webkit-appearance: none;
  background: linear-gradient(90deg, var(--gold-500), rgba(232, 200, 138, 0.16));
  outline: none; cursor: pointer;
}
.music__slider input::-webkit-slider-thumb {
  appearance: none; -webkit-appearance: none;
  width: 12px; height: 12px; border-radius: 50%;
  background: var(--gold-100); box-shadow: 0 0 10px var(--gold-300);
}
.music__slider input::-moz-range-thumb {
  width: 12px; height: 12px; border: 0; border-radius: 50%;
  background: var(--gold-100); box-shadow: 0 0 10px var(--gold-300);
}

.music__toggles { display: flex; gap: 0.5rem; margin-top: 1.1rem; flex-wrap: wrap; }

.panel-enter-active, .panel-leave-active {
  transition: opacity 0.42s var(--ease-soft), transform 0.42s var(--ease-film);
}
.panel-enter-from, .panel-leave-to { opacity: 0; transform: translateY(14px) scale(0.95); }

@media (max-width: 760px) {
  .music { left: 1rem; bottom: calc(var(--letterbox) + 1.1rem); }
  .music__orb { width: 46px; height: 46px; border-radius: 15px; }
  .music__panel { width: min(290px, calc(100vw - 2rem)); border-radius: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .panel-enter-active, .panel-leave-active,
  .sound-enter-active, .sound-leave-active { transition-duration: 0.01s; }
  .music__orb { transition: none; }
  .music__whisper { animation: none; opacity: 1; }
}
</style>
