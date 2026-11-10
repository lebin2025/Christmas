import { onMounted, onUnmounted, watch } from 'vue'
import { useExperience } from './useExperience.js'
import { ACT_COUNT } from '../assets/assets.js'

const AUTO_INTERVAL = 9000
const WHEEL_THRESHOLD = 42
const GESTURE_GAP = 220
const INERTIA_COOLDOWN = 950

/**
 * The projectionist: wheel / keyboard / swipe turn exactly one page, and an
 * optional auto-screening advances every nine seconds. Pointer parallax is a
 * smoothed CSS variable pair — never a scroll listener, never a GSAP scrub.
 */
export function useFilmControls() {
  const { state, goToAct, nextAct, prevAct, setAutoPlay } = useExperience()
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

  let wheelSum = 0
  let lastWheel = 0
  let inertiaUntil = 0
  let touchY = 0
  let autoTimer = null
  let autoTurnAt = 0
  let raf = 0
  let px = 0, py = 0, tx = 0, ty = 0
  let disposed = false

  const isFormTarget = (target) => Boolean(
    target?.closest?.('input, textarea, select, [contenteditable="true"]'),
  )
  // A swipe that begins on the letter paper is usually writing, not a page
  // turn; wheel/keyboard over it must still be able to advance the film.
  const isTouchFormTarget = (target) => Boolean(
    target?.closest?.('input, textarea, select, [contenteditable="true"], .letter__paper, .music__panel'),
  )

  /** Any deliberate human navigation takes the projector back to manual. */
  const manual = (turn) => {
    if (state.transitioning) return
    if (state.autoPlay) setAutoPlay(false)
    turn()
  }

  const step = (direction) => manual(() => (direction > 0 ? nextAct() : prevAct()))

  // ---- wheel: one gesture = one page, trackpad inertia is swallowed ------
  const onWheel = (e) => {
    if (isFormTarget(e.target)) return
    e.preventDefault()
    const now = performance.now()
    if (state.transitioning || now < inertiaUntil) { wheelSum = 0; lastWheel = now; return }
    if (now - lastWheel > GESTURE_GAP) wheelSum = 0
    lastWheel = now
    wheelSum += e.deltaY
    if (Math.abs(wheelSum) >= WHEEL_THRESHOLD) {
      const dir = wheelSum > 0 ? 1 : -1
      wheelSum = 0
      inertiaUntil = now + INERTIA_COOLDOWN
      step(dir)
    }
  }

  // ---- keyboard ---------------------------------------------------------
  const onKey = (e) => {
    if (isFormTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
    const k = e.key
    if (k === 'ArrowDown' || k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Spacebar') {
      e.preventDefault(); step(1)
    } else if (k === 'ArrowUp' || k === 'ArrowLeft' || k === 'PageUp') {
      e.preventDefault(); step(-1)
    } else if (k === 'Home') {
      e.preventDefault(); manual(() => goToAct(0))
    } else if (k === 'End') {
      e.preventDefault(); manual(() => goToAct(ACT_COUNT - 1))
    } else if (/^[1-6]$/.test(k)) {
      e.preventDefault(); manual(() => goToAct(Number(k) - 1))
    }
  }

  // ---- touch ------------------------------------------------------------
  const onTouchStart = (e) => { touchY = e.touches[0]?.clientY ?? 0 }
  const onTouchEnd = (e) => {
    if (isTouchFormTarget(e.target)) return
    const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY)
    if (Math.abs(dy) > 48) step(dy > 0 ? 1 : -1)
  }

  // ---- pointer parallax (desktop only, stops when settled) --------------
  const tick = () => {
    px += (tx - px) * 0.055
    py += (ty - py) * 0.055
    document.documentElement.style.setProperty('--par-x', px.toFixed(4))
    document.documentElement.style.setProperty('--par-y', py.toFixed(4))
    if (Math.abs(tx - px) > 0.0008 || Math.abs(ty - py) > 0.0008) {
      raf = requestAnimationFrame(tick)
    } else {
      raf = 0
    }
  }
  const onPointerMove = (e) => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2
    ty = (e.clientY / window.innerHeight - 0.5) * 2
    if (!raf) raf = requestAnimationFrame(tick)
  }
  const onPointerLeave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick) }

  // ---- auto screening ---------------------------------------------------
  const stopAutoWatch = watch(() => state.autoPlay, (on) => {
    clearInterval(autoTimer)
    autoTimer = null
    if (!on) return
    autoTimer = setInterval(() => {
      if (state.activeAct >= ACT_COUNT - 1) { setAutoPlay(false); return }
      autoTurnAt = performance.now()
      nextAct()
    }, AUTO_INTERVAL)
  })

  // A human page turn (nav dot, scene button, wheel, key) cancels auto mode.
  const stopActWatch = watch(() => state.activeAct, () => {
    if (state.autoPlay && performance.now() - autoTurnAt > 1400) setAutoPlay(false)
  })

  onMounted(() => {
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    if (finePointer && !state.reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave)
    }
  })

  onUnmounted(dispose)

  function dispose() {
    if (disposed) return
    disposed = true
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchend', onTouchEnd)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerleave', onPointerLeave)
    if (raf) cancelAnimationFrame(raf)
    clearInterval(autoTimer)
    stopAutoWatch()
    stopActWatch()
    document.documentElement.style.removeProperty('--par-x')
    document.documentElement.style.removeProperty('--par-y')
  }

  return { dispose }
}
