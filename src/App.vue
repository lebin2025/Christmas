<script setup>
import { onMounted, onUnmounted } from 'vue'
import { ACT_COUNT, AUDIO } from './assets/assets.js'
import { useExperience } from './composables/useExperience.js'
import { dbReady } from './composables/useDatabase.js'
import { useFilmControls } from './composables/useFilmControls.js'
import { useAudio } from './composables/useAudio.js'

import Navigation from './components/Navigation.vue'
import SnowParticles from './components/SnowParticles.vue'
import MusicController from './components/MusicController.vue'
import CinematicOverlay from './components/CinematicOverlay.vue'
import SceneTransition from './components/SceneTransition.vue'
import FilmControls from './components/FilmControls.vue'

import OpeningScene from './scenes/OpeningScene.vue'
import TownScene from './scenes/TownScene.vue'
import TreeScene from './scenes/TreeScene.vue'
import CabinScene from './scenes/CabinScene.vue'
import WishesScene from './scenes/WishesScene.vue'
import FinaleScene from './scenes/FinaleScene.vue'

const { state, load, goToAct, nextAct, prevAct, setAutoPlay, almostSay, whisper, unspokenCount } = useExperience()
const audio = useAudio()
const controls = useFilmControls()

/* A hidden line for each act. Double-clicking the picture — anywhere that is
   not a control — lets the night almost say something. */
const HIDDEN_LINES = [
  '我提早到了，只为了在人群里多看你一眼。',
  '那扇窗亮着，我却往暗处退了半步。',
  '许愿的时候，我只敢把你的名字念到一半。',
  '你低头看火，我低头看你，谁都没先开口。',
  '地址写了又擦掉，最后只写了「圣诞收」。',
  '如果明年下雪，我还会在原地。',
]
function onDoubleClick(e) {
  const t = e.target
  if (t?.closest?.('button, input, textarea, select, a, label, .music, .film-console, .act-nav, .brand')) return
  almostSay(HIDDEN_LINES[state.activeAct] ?? HIDDEN_LINES[0])
}

const loaded = []
function markLoaded(src) { if (!loaded.includes(src)) loaded.push(src) }

onMounted(() => {
  load()
  // Exposed for the visual acceptance script (harmless in production).
  window.__christmas = { state, loaded, audio, musicSrc: AUDIO.music, goToAct, nextAct, prevAct, setAutoPlay, almostSay, whisper, unspokenCount, dbReady, ACT_COUNT }
  // Browsers only allow audio after a real gesture; preload on the first one.
  audio.armAutoplay()
})

onUnmounted(() => {
  controls.dispose()
  audio.dispose()
})
</script>

<template>
  <!-- The fixed camera: six real photographic plates, one projected at a time. -->
  <div class="camera" @dblclick="onDoubleClick">
    <OpeningScene @loaded="markLoaded" />
    <TownScene @loaded="markLoaded" />
    <TreeScene @loaded="markLoaded" />
    <CabinScene @loaded="markLoaded" />
    <WishesScene @loaded="markLoaded" />
    <FinaleScene @loaded="markLoaded" />
  </div>

  <SnowParticles />
  <CinematicOverlay />
  <Navigation />
  <MusicController />
  <SceneTransition />
  <FilmControls />
</template>
