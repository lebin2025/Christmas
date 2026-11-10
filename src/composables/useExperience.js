import { reactive, computed, ref } from 'vue'
import { ACTS, ACT_COUNT } from '../assets/assets.js'
import { dbGetWishes, dbAddWish, dbRemoveWish, dbGetUnspoken, dbSetUnspoken } from './useDatabase.js'

/**
 * The projection booth. There is no scroll position at all: the whole film is
 * a fixed stack of six scenes and `activeAct` is the single source of truth.
 */
const state = reactive({
  activeAct: 0,
  progress: 1 / ACT_COUNT,      // stepped film progress, not a scrubbed value
  transitioning: false,        // the black splice veil is on screen
  autoPlay: false,             // optional hands-off screening
  reducedMotion: false,
  snowEnabled: true,
  snowDensity: 1,
  soundOn: false,
  volume: 0.55,
  ambienceOn: false,        // the supplied song is a full recording: no wind layered on top by default
  treeLightsOn: true,
  giftOpened: false,
  letterOpened: false,
  wishes: [],
})

/**
 * One shared emotional thread. Any act can hand a line it never dared to say
 * to the little note in the lower-left corner: it unfolds, glows for a beat,
 * and is taken back. The count survives reloads (persisted to SQLite), just
 * like the wishes.
 */
const whisper = ref(null)
const unspokenCount = ref(0)
let whisperTimer = 0

function almostSay(text) {
  const line = String(text || '……其实，我很想你。')
  const id = Date.now() + Math.random().toString(36).slice(2, 7)
  unspokenCount.value += 1
  whisper.value = { id, text: line }
  // Persist to SQLite; the reactive count already updated for instant UI.
  dbSetUnspoken(unspokenCount.value).catch(() => {})
  clearTimeout(whisperTimer)
  whisperTimer = setTimeout(() => {
    if (whisper.value?.id === id) whisper.value = null
  }, 1800)
}

function hush() {
  clearTimeout(whisperTimer)
  whisper.value = null
}

function saveWish(text) {
  const clean = text.trim().slice(0, 140)
  if (!clean) return false
  const wish = {
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    text: clean,
    at: new Date().toISOString(),
  }
  state.wishes.unshift(wish)
  state.wishes = state.wishes.slice(0, 24)
  // Fire-and-forget SQLite write; the ref is already updated for the UI.
  dbAddWish(wish).catch(() => {})
  // Return the saved entry so the letter can immediately re-read it.
  return wish
}

function removeWish(id) {
  state.wishes = state.wishes.filter((w) => w.id !== id)
  dbRemoveWish(id).catch(() => {})
}

/**
 * A line too shy to be said aloud, handed from one act to ACT V's letter
 * paper. The id keeps the watch firing even for identical text.
 */
const letterDraft = ref(null)
function draftLetter(text) {
  letterDraft.value = {
    text: String(text || '').slice(0, 140),
    id: Date.now() + Math.random().toString(36).slice(2, 7),
  }
}

/** The black splice reaches full opacity at 35% of its 0.98s animation. */
const SPLICE_PEAK = 350
const SPLICE_END = 1000
let swapTimer = null
let endTimer = null

function commitAct(i) {
  state.activeAct = i
  state.progress = (i + 1) / ACT_COUNT
}

/**
 * Turn the page. `immediate` is used by reduced-motion users, the QA harness
 * and the very first render — it skips the black splice entirely.
 */
function goToAct(index, immediate = false) {
  const i = Math.max(0, Math.min(ACT_COUNT - 1, index))
  if (i === state.activeAct || state.transitioning) return
  clearTimeout(swapTimer)
  clearTimeout(endTimer)
  if (immediate || state.reducedMotion) {
    state.transitioning = false
    commitAct(i)
    return
  }
  state.transitioning = true
  swapTimer = setTimeout(() => commitAct(i), SPLICE_PEAK)
  endTimer = setTimeout(() => { state.transitioning = false }, SPLICE_END)
}

function nextAct() { goToAct(state.activeAct + 1) }
function prevAct() { goToAct(state.activeAct - 1) }
function setAutoPlay(on) { state.autoPlay = Boolean(on) }
function toggleAutoPlay() { state.autoPlay = !state.autoPlay }

/**
 * Hydrate persisted state from SQLite (IndexedDB). The reactive refs update
 * as soon as the DB answers; until then the defaults above hold.
 */
async function load() {
  state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  state.progress = 1 / ACT_COUNT
  try {
    const [wishes, unspoken] = await Promise.all([dbGetWishes(), dbGetUnspoken()])
    state.wishes = wishes
    unspokenCount.value = unspoken
  } catch (err) {
    console.warn('[experience] hydration from SQLite failed:', err)
  }
}

export function useExperience() {
  return {
    state,
    acts: ACTS,
    actCount: ACT_COUNT,
    activeActLabel: computed(() => ACTS[state.activeAct]?.title ?? ''),
    goToAct,
    nextAct,
    prevAct,
    setAutoPlay,
    toggleAutoPlay,
    saveWish,
    removeWish,
    letterDraft,
    draftLetter,
    whisper,
    unspokenCount,
    almostSay,
    hush,
    load,
  }
}
