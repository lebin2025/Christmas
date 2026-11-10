import { ref } from 'vue'
import { Howl } from 'howler'
import { AUDIO } from '../assets/assets.js'

/**
 * A completely separate record for the ACT III music box. The site-wide
 * `useAudio` keeps playing "A Letter I Never Sent"; this one owns only
 * "Snowflakes & Unspoken Love". Path is configured once in assets.js.
 *
 * Nothing is created until the visitor actually opens the box, and no Howl is
 * ever played without an explicit Play press. While this record is playing the
 * site-wide one is suspended, so two songs never overlap.
 */
let track = null
let rafId = 0
let pauseTimer = 0
let pauseToken = 0
let suspendedGlobal = false

const isPlaying = ref(false)
const isReady = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.72)

function ensure() {
  if (track) return track
  track = new Howl({
    src: [AUDIO.musicBox],
    html5: true,          // M4A/AAC: the browser media stack decodes it reliably
    preload: false, // stream on play — never preload the 3-minute record
    loop: false,
    volume: 0,
    onload: () => {
      isReady.value = true
      duration.value = Number(track?.duration()) || 0
    },
    onend: () => {
      isPlaying.value = false
      currentTime.value = 0
      track?.seek(0)
      stopTick()
      restoreGlobal()
    },
    onloaderror: (_id, err) => console.warn('[music-box] record failed to load:', err),
    onplayerror: (_id, err) => console.warn('[music-box] record failed to play:', err),
  })
  return track
}

function startTick() {
  if (rafId) return
  const tick = () => {
    if (!isPlaying.value || !track) { rafId = 0; return }
    const pos = track.seek()
    if (typeof pos === 'number') {
      currentTime.value = pos
      if (!duration.value) duration.value = Number(track.duration()) || 0
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}
function stopTick() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

/** Never let two records sing at once; remember whether to give it back. */
function suspendGlobal(globalAudio) {
  if (globalAudio?.isPlaying?.value) {
    globalAudio.pause()
    suspendedGlobal = true
  }
}
function restoreGlobal(globalAudio) {
  if (suspendedGlobal && globalAudio) {
    suspendedGlobal = false
    globalAudio.play()
  }
}

function play(globalAudio) {
  ensure()
  pauseToken += 1
  clearTimeout(pauseTimer)
  suspendGlobal(globalAudio)
  if (!track.playing()) track.play()
  // A soft wind-up instead of a hard start.
  track.volume(0)
  track.fade(0, volume.value, 900)
  isPlaying.value = true
  duration.value = Number(track.duration()) || duration.value
  startTick()
}

function pause(globalAudio) {
  if (!track) return
  const token = ++pauseToken
  clearTimeout(pauseTimer)
  track.fade(track.volume(), 0, 380)
  pauseTimer = setTimeout(() => {
    if (token === pauseToken && !isPlaying.value) track.pause()
  }, 400)
  isPlaying.value = false
  const pos = track.seek()
  if (typeof pos === 'number') currentTime.value = pos
  stopTick()
  restoreGlobal(globalAudio)
}

function toggle(globalAudio) {
  if (isPlaying.value) pause(globalAudio)
  else play(globalAudio)
}

function seek(seconds) {
  ensure()
  const t = Math.max(0, Math.min(duration.value || 0, Number(seconds) || 0))
  track.seek(t)
  currentTime.value = t
}

function setVolume(v) {
  volume.value = Math.max(0, Math.min(1, Number(v)))
  if (track && isPlaying.value) track.volume(volume.value)
}

/** Fade out and let go of the audio element entirely. */
function dispose(globalAudio) {
  pauseToken += 1
  clearTimeout(pauseTimer)
  stopTick()
  isPlaying.value = false
  if (track) {
    track.stop()
    track.unload()
    track = null
  }
  restoreGlobal(globalAudio)
  isReady.value = false
  currentTime.value = 0
  duration.value = 0
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * `globalAudio` is the site-wide useAudio() handle, supplied by the component
 * so this module never has to call a composition API outside a component.
 */
export function useMusicBoxAudio(globalAudio) {
  const api = {
    isPlaying, isReady, currentTime, duration, volume,
    ensure: () => ensure(),
    play: () => play(globalAudio),
    pause: () => pause(globalAudio),
    toggle: () => toggle(globalAudio),
    seek, setVolume, formatTime,
    dispose: () => dispose(globalAudio),
    src: AUDIO.musicBox,
  }
  return api
}
