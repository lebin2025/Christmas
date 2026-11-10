import { ref, onUnmounted } from 'vue'
import { Howl, Howler } from 'howler'
import { AUDIO } from '../assets/assets.js'
import { useExperience } from './useExperience.js'

let music = null
let ambience = null
let initialised = false
let rafId = 0

const isPlaying = ref(false)
const isReady = ref(false)
const progress = ref(0)      // 0..1 within the music loop
const volume = ref(0.55)

function ensure() {
  if (initialised) return
  initialised = true
  Howler.volume(volume.value)
  music = new Howl({
    src: [AUDIO.music],
    // The supplied track is an M4A/AAC recording. Let the browser's media
    // stack decode it (Web Audio's decodeAudioData is less reliable for AAC
    // in some Chromium builds) while keeping Howler's loop/seek/volume API.
    html5: true,
    loop: true,
    volume: 0.6,
    preload: true,
    onload: () => { isReady.value = true },
    onloaderror: (_id, err) => console.warn('[audio] music failed to load:', err),
    onplayerror: (_id, err) => console.warn('[audio] music failed to play:', err),
  })
  ambience = new Howl({
    src: [AUDIO.ambience],
    loop: true,
    volume: 0.22,
    preload: true,
    onloaderror: (_id, err) => console.warn('[audio] ambience failed to load:', err),
  })
}

function tick() {
  if (music && isPlaying.value) {
    const pos = music.seek()
    if (typeof pos === 'number' && music.duration()) {
      progress.value = (pos % music.duration()) / music.duration()
    }
  }
  rafId = requestAnimationFrame(tick)
}

function play() {
  ensure()
  const { state } = useExperience()
  if (!music.playing()) music.play()
  if (state.ambienceOn && ambience && !ambience.playing()) ambience.play()
  isPlaying.value = true
  state.soundOn = true
  if (!rafId) tick()
}

function pause() {
  const { state } = useExperience()
  if (music) music.pause()
  if (ambience) ambience.pause()
  isPlaying.value = false
  state.soundOn = false
}

function toggle() {
  if (isPlaying.value) pause()
  else play()
}

function setVolume(v) {
  volume.value = Math.max(0, Math.min(1, Number(v)))
  Howler.volume(volume.value)
  const { state } = useExperience()
  state.volume = volume.value
}

function setAmbience(on) {
  const { state } = useExperience()
  state.ambienceOn = on
  if (!ambience) return
  if (on && isPlaying.value && !ambience.playing()) ambience.play()
  else if (!on && ambience.playing()) ambience.pause()
}

/** Restart the record from the top — used by the gramophone control. */
function restart() {
  ensure()
  if (music) music.seek(0)
  play()
}

/** First-gesture bootstrap: browsers block autoplay until a real interaction. */
function armAutoplay() {
  const onFirst = () => {
    window.removeEventListener('pointerdown', onFirst)
    window.removeEventListener('keydown', onFirst)
    // Do not force music on; respect the visitor's choice. Just preload.
    ensure()
  }
  window.addEventListener('pointerdown', onFirst, { once: true })
  window.addEventListener('keydown', onFirst, { once: true })
}

function dispose() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  if (music) music.unload()
  if (ambience) ambience.unload()
  music = null
  ambience = null
  initialised = false
}

/** Length of the loaded track in seconds (0 until the browser has metadata). */
function duration() { return music ? Number(music.duration()) || 0 : 0 }

export function useAudio() {
  onUnmounted(() => { /* Howls are app-wide singletons; App owns disposal */ })
  return { isPlaying, isReady, progress, volume, ensure, play, pause, toggle, setVolume, setAmbience, restart, armAutoplay, dispose, duration }
}
