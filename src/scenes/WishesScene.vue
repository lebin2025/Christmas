<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import { PLATES, OVERLAYS, SCENES, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'

const { state, saveWish, removeWish, goToAct, letterDraft } = useExperience()
const wishText = ref('')
const toast = ref('')
const mode = ref('write')        // 'write' = fresh page, 'read' = a saved line is on the paper
const selectedId = ref(null)
const paperRef = ref(null)

const selectedWish = computed(() => state.wishes.find((w) => w.id === selectedId.value) || null)
const isReading = computed(() => mode.value === 'read' && Boolean(selectedWish.value))
let toastTimer = 0

/* The addressee is almost written, then changed back before anyone sees it. */
const salutation = ref('Dear Christmas,')
let saluteTimer = 0
function almostWriteName() {
  if (salutation.value !== 'Dear Christmas,') return
  salutation.value = 'Dear 你，'
  flash('……还是不敢写你的名字。')
  clearTimeout(saluteTimer)
  saluteTimer = setTimeout(() => { salutation.value = 'Dear Christmas,' }, 1500)
}
onUnmounted(() => clearTimeout(saluteTimer))

function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2600)
}

/** Focus without letting a long draft scroll its first lines out of view. */
function focusPaper() {
  nextTick(() => {
    const ta = paperRef.value?.querySelector('textarea')
    if (!ta) return
    ta.focus({ preventScroll: true })
    ta.setSelectionRange(0, 0)
    ta.scrollTop = 0
  })
}

function openLetter() {
  // A clean page. Saved lines are picked from the shelf below, never pasted
  // into the input as if they were a draft.
  state.letterOpened = true
}

/* A line from the "words I never said" console arrives as a draft: open the
   letter, switch to writing, and let the ink sit there until they decide. */
watch(letterDraft, (draft) => {
  if (!draft) return
  state.letterOpened = true
  mode.value = 'write'
  selectedId.value = null
  wishText.value = draft.text
  flash('先替你把这句收好，不寄。')
  focusPaper()
})

function pick(w) {
  state.letterOpened = true
  selectedId.value = w.id
  mode.value = 'read'
}

function writeAgain() {
  mode.value = 'write'
  selectedId.value = null
  wishText.value = ''
  focusPaper()
}

function submit() {
  const saved = saveWish(wishText.value)
  if (!saved) {
    flash('先写一句吧，哪怕只写给自己。')
    return
  }
  wishText.value = ''
  // Let the ink settle on the paper instead of clearing it away.
  selectedId.value = saved.id
  mode.value = 'read'
  flash('折好了。墨迹留在信上，话留在心里。')
}

function discard(w, e) {
  e.stopPropagation()
  removeWish(w.id)
  if (selectedId.value === w.id) {
    selectedId.value = null
    mode.value = 'write'
  }
  flash('这句，就当没写过。')
}

const preview = (t) => (t.length > 11 ? `${t.slice(0, 11)}…` : t)
function dateOf(w) {
  const d = new Date(w.at)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
}
</script>

<template>
  <SceneShell
    :index="4"
    :image="SCENES.letters"
    numeral="V"
    kicker="ACT V"
    eyebrow="ADDRESSED TO NO ONE"
    title="LETTERS TO CHRISTMAS"
    subtitle="收件人写着圣诞，不是你"
    lede="称呼写了又划掉，最后只写「亲爱的圣诞」。它不会问是给谁的。"
    hint="WRITE · FOLD · NEVER SEND"
    object-position="50% 50%"
    light-position="left: 24%; top: 4%;"
  >
    <template #atmosphere>
      <img class="atmo wishes__dust" :src="OVERLAYS.goldenDust" alt="" />
      <img class="atmo atmo--fog" :src="OVERLAYS.fog" alt="" />
      <div class="wishes__motes" aria-hidden="true">
        <i v-for="n in 16" :key="n" :style="{ '--n': n }"></i>
      </div>
    </template>

    <template #mid>
      <img class="wishes__star" :src="CUTOUTS.star" alt="" />
      <div class="depth-object wishes__bow" :style="{ '--tilt': '-8deg' }"><img :src="CUTOUTS.bow" alt="" /></div>
    </template>

    <template #interaction>
      <div class="letter-block">
        <div class="letter" :class="{ 'is-open': state.letterOpened, 'is-reading': isReading }">
          <img class="letter__img letter__img--closed" :src="PLATES.letterClosed" alt="封好的信" />
          <img class="letter__img letter__img--open" :src="PLATES.letterOpen" alt="展开的信纸" />
          <button class="letter__seal" v-if="!state.letterOpened" @click="openLetter">
            <span>✦</span><small>展开信纸</small>
          </button>
          <div class="letter__paper" v-else ref="paperRef">
            <button
              class="letter__salutation"
              :class="{ 'is-shy': salutation !== 'Dear Christmas,' }"
              title="试着写下收件人"
              @click="almostWriteName"
            >{{ salutation }}</button>
            <textarea
              v-if="!isReading"
              v-model="wishText"
              maxlength="140"
              rows="4"
              placeholder="其实，我想跟你说……"
              aria-label="写下那句没说出口的话"
              @keydown.ctrl.enter="submit"
              @keydown.meta.enter="submit"
            ></textarea>
            <div class="letter__ink" v-else :key="selectedWish.id">
              <p>{{ selectedWish.text }}</p>
              <small>✦ &nbsp;折好于 {{ dateOf(selectedWish) }}</small>
            </div>
            <span class="letter__count" v-if="!isReading">{{ wishText.length }} / 140</span>
          </div>
        </div>

        <div class="letter-actions">
          <button class="film-btn" v-if="!isReading" @click="submit">
            <span class="film-btn__dot"></span>SEAL THE WISH
          </button>
          <button class="film-btn" v-else @click="writeAgain" title="再写一句">
            <span class="film-btn__dot"></span>WRITE AGAIN
          </button>
          <button class="chip" @click="state.letterOpened = !state.letterOpened">
            {{ state.letterOpened ? '折好信纸' : '重新摊开' }}
          </button>
        </div>

        <div class="wish-log">
          <span class="act-numeral">已收好 {{ state.wishes.length }} 句没敢说的话 · 轻点一句，让墨迹回到信上</span>
          <ul
            class="wish-shelf"
            :class="{ 'is-scrolling': state.wishes.length > 4 }"
            v-if="state.wishes.length"
          >
            <li
              class="wish-tab"
              v-for="w in state.wishes"
              :key="w.id"
              :class="{ 'is-picked': isReading && w.id === selectedId }"
            >
              <button class="wish-tab__main" :title="w.text" @click="pick(w)">
                <span>✦</span><em>{{ preview(w.text) }}</em>
              </button>
              <button
                class="wish-tab__del"
                :aria-label="`删掉这句：${w.text}`"
                title="删除这句"
                @click="discard(w, $event)"
              >×</button>
            </li>
          </ul>
          <p class="wish-log__empty" v-else>还没有一句，被写下来。</p>
        </div>

        <button class="chip wishes__next" @click="goToAct(5)">✦ &nbsp;去看看，雪把它们带去了哪里</button>
        <transition name="toast"><div class="wish-toast" v-if="toast">{{ toast }}</div></transition>
      </div>
    </template>

    <template #foreground>
      <div class="depth-object wishes__pine"><img :src="CUTOUTS.pine" alt="" /></div>
    </template>
  </SceneShell>
</template>

<style scoped>
.wishes__dust { opacity: 0.065; animation: slow-drift 18s ease-in-out infinite; }
.wishes__motes { position: absolute; inset: 0; }
.wishes__motes i {
  position: absolute; bottom: -10%; left: calc(4% + var(--n) * 5.8%);
  width: 3px; height: 3px; border-radius: 50%;
  background: #ffe9b8; box-shadow: 0 0 10px 3px rgba(255, 205, 120, 0.6);
  animation: dust-rise 9s linear infinite;
  animation-delay: calc(var(--n) * -0.62s);
  opacity: 0;
}
.wishes__star {
  position: absolute; left: 8%; top: 12%; width: clamp(90px, 11vw, 165px);
  opacity: 0.42; filter: drop-shadow(0 0 26px rgba(255, 202, 120, 0.4));
  animation: star-pulse 5s var(--ease-soft) infinite;
}
.wishes__bow { width: clamp(80px, 9vw, 140px); right: 6%; bottom: 10%; opacity: 0.55; animation: gentle-float 10s var(--ease-soft) infinite; }
.wishes__pine { width: clamp(170px, 20vw, 320px); right: -8%; bottom: -20%; transform: rotate(34deg); opacity: 0.42; }

.letter-block { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; }
.letter {
  position: relative; width: clamp(220px, 26vw, 390px); aspect-ratio: 1;
  filter: drop-shadow(0 24px 46px rgba(0, 0, 0, 0.72)) sepia(0.16) brightness(0.88) contrast(1.06);
}
.letter__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.95s var(--ease-soft), transform 1.1s var(--ease-film); }
.letter__img--open { opacity: 0; transform: scale(1.06); }
.letter.is-open .letter__img--closed { opacity: 0; transform: scale(0.94); }
.letter.is-open .letter__img--open { opacity: 1; transform: scale(1); }

.letter__seal {
  position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%);
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  color: #fff3d8; text-shadow: 0 2px 12px rgba(0,0,0,0.9);
  font-family: var(--font-cn); font-size: 0.82rem; letter-spacing: 0.18em;
}
.letter__seal span { font-size: 1.5rem; color: var(--gold-100); animation: star-pulse 3s var(--ease-soft) infinite; }
.letter__seal small { font-family: var(--font-display); font-size: 0.56rem; letter-spacing: 0.26em; }
.letter__seal:hover { transform: translate(-50%, -50%) scale(1.06); }

/* The photographed sheet leans about -7deg, so the handwriting leans with it.
   Only opacity is animated here — a transform keyframe would fight the tilt. */
.letter__paper {
  position: absolute; left: 22%; top: 16%; width: 48%; height: 40%;
  display: flex; flex-direction: column;
  transform: rotate(-6.5deg);
  transform-origin: 50% 18%;
  font-family: var(--font-hand);
  font-style: italic;
  animation: ink-fade 0.9s var(--ease-soft) both;
}
.letter.is-reading .letter__paper { width: 51%; height: 43%; }
.letter__salutation {
  display: block; align-self: flex-start; text-align: left; padding: 0;
  font-family: inherit; font-style: italic;
  font-size: 0.92rem; letter-spacing: 0.02em;
  color: #6d4c2c; margin-bottom: 0.3rem;
  text-shadow: 0 0 1px rgba(80, 55, 30, 0.35);
  transition: color 0.5s var(--ease-soft), transform 0.5s var(--ease-soft);
}
.letter__salutation:hover { color: #4b3320; }
/* The real addressee appears for a second, then is crossed out again. */
.letter__salutation.is-shy { color: #8a3b32; transform: rotate(-2deg) translateX(2px); }
.letter__paper textarea {
  flex: 1; min-height: 0; width: 100%; resize: none; border: 0; outline: 0; padding: 0;
  background: transparent; color: #4b3320;
  font-family: inherit; font-style: italic; font-size: 0.95rem; line-height: 1.62;
  letter-spacing: 0.05em;
}
.letter__paper textarea::placeholder { color: rgba(90, 66, 40, 0.42); }
.letter__count { align-self: flex-end; font-family: var(--font-display); font-size: 0.5rem; letter-spacing: 0.12em; color: rgba(90, 66, 40, 0.55); }

/* A chosen, already-sealed line, reappearing as ink on the page. */
.letter__ink {
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  animation: ink-appear 1.05s var(--ease-soft) both;
}
.letter__ink p {
  flex: 1; min-height: 0; margin: 0;
  overflow-y: auto; scrollbar-width: none;
  color: #4b3320;
  font-size: clamp(0.82rem, 1.04vw, 1rem);
  line-height: 1.65; letter-spacing: 0.06em;
  white-space: pre-wrap; word-break: break-word;
  text-shadow: 0 0 1px rgba(75, 51, 32, 0.3);
}
.letter__ink p::-webkit-scrollbar { display: none; }
.letter__ink small {
  align-self: flex-end; margin-top: 0.3rem;
  font-family: var(--font-elegant); font-size: 0.62rem;
  letter-spacing: 0.14em; color: rgba(74, 51, 30, 0.84);
}

@keyframes ink-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ink-appear {
  from { opacity: 0; filter: blur(7px); transform: translateY(7px); }
  to { opacity: 1; filter: blur(0); transform: translateY(0); }
}

.letter-actions { display: flex; gap: 0.55rem; flex-wrap: wrap; justify-content: center; }

/* A shelf of small sealed slips — not a card list. */
.wish-log { width: 100%; max-width: min(100%, 460px); text-align: center; margin-top: 0.2rem; }
.wish-log .act-numeral {
  font-size: 0.56rem; letter-spacing: 0.16em;
  color: rgba(232, 200, 138, 0.92);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.9);
}
.wish-shelf {
  list-style: none; margin: 0.6rem 0 0; padding: 0 0 0.4rem;
  display: flex; justify-content: center; gap: 0.4rem;
  flex-wrap: nowrap; overflow-x: auto; overflow-y: hidden;
  box-sizing: border-box; max-width: 100%;
  scrollbar-width: none; -ms-overflow-style: none;
  scroll-snap-type: x proximity;
}
.wish-shelf::-webkit-scrollbar { display: none; }
.wish-shelf.is-scrolling {
  justify-content: flex-start;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 3%, #000 95%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 3%, #000 95%, transparent);
}
.wish-tab {
  flex: 0 0 auto; scroll-snap-align: center;
  display: inline-flex; align-items: center;
  border: 1px solid rgba(232, 200, 138, 0.2); border-radius: 2px;
  background: rgba(8, 12, 22, 0.46);
  backdrop-filter: blur(6px);
  transition: border-color 0.4s, background 0.4s, box-shadow 0.4s, transform 0.4s;
}
.wish-tab:hover { border-color: rgba(232, 200, 138, 0.52); transform: translateY(-2px); }
.wish-tab.is-picked {
  border-color: rgba(232, 200, 138, 0.72);
  background: rgba(232, 200, 138, 0.13);
  box-shadow: 0 0 18px rgba(232, 200, 138, 0.18), inset 0 0 12px rgba(232, 200, 138, 0.08);
}
.wish-tab__main {
  display: inline-flex; align-items: center; gap: 0.38rem;
  padding: 0.38rem 0.5rem; max-width: 12rem;
  color: var(--ink-soft); font-family: var(--font-cn);
  font-size: 0.68rem; letter-spacing: 0.06em; white-space: nowrap;
}
.wish-tab__main span { color: var(--gold-500); font-size: 0.58rem; }
.wish-tab__main em { font-style: normal; overflow: hidden; text-overflow: ellipsis; }
.wish-tab.is-picked .wish-tab__main { color: var(--gold-100); }
.wish-tab__del {
  padding: 0 0.45rem 0 0.1rem;
  color: var(--ink-faint); font-size: 0.9rem; line-height: 1;
  opacity: 0.35; transition: opacity 0.3s, color 0.3s;
}
.wish-tab:hover .wish-tab__del, .wish-tab__del:focus-visible { opacity: 1; }
.wish-tab__del:hover { color: var(--gold-100); }

.wish-log__empty { margin: 0.4rem 0 0; font-family: var(--font-elegant); font-size: 0.9rem; color: var(--ink-faint); }
.wishes__next { margin-top: 0.2rem; }

/* A subtitle-like flash above the letter; it must never push the console. */
.wish-toast {
  position: absolute; left: 0; right: 0; top: -2.9rem;
  width: max-content; max-width: 100%; margin: 0 auto; z-index: 3;
  font-family: var(--font-cn); font-size: 0.76rem; letter-spacing: 0.12em;
  color: var(--gold-100); border: 1px solid rgba(232, 200, 138, 0.25);
  background: rgba(8, 12, 22, 0.72); padding: 0.5rem 1rem; border-radius: 2px;
  backdrop-filter: blur(10px);
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.5s, transform 0.5s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }

@media (max-width: 900px) {
  .wishes__star, .wishes__bow, .wishes__pine { display: none; }
  .letter { width: clamp(210px, 58vw, 330px); }
  .letter__paper { left: 20%; top: 15%; width: 52%; height: 41%; }
  .letter.is-reading .letter__paper { width: 54%; height: 44%; }
  .wish-tab__main { max-width: 10rem; }
}
@media (max-width: 480px) {
  .letter { width: min(62vw, 228px); }
  .letter__paper textarea { font-size: 0.76rem; }
  .letter__ink p { font-size: 0.74rem; line-height: 1.58; }
  .letter__salutation { font-size: 0.7rem; }
  .letter__ink small { font-size: 0.48rem; }
  .letter-block { gap: 0.4rem; transform: translateY(-26px); }
  .wish-toast { top: -2.5rem; font-size: 0.68rem; }
  .wish-log .act-numeral { font-size: 0.5rem; }
  .wish-tab__main { font-size: 0.62rem; max-width: 8.5rem; }
  /* The bottom film console already has NEXT — no second CTA competing for
     the last few pixels above it on a phone. */
  .wishes__next { display: none; }
}
/* Touch devices have no hover, so the delete affordance stays visible. */
@media (hover: none) {
  .wish-tab__del { opacity: 0.75; }
}
@media (prefers-reduced-motion: reduce) {
  .letter__paper, .letter__ink { animation: none; }
  .wish-tab { transition: none; }
}
</style>
