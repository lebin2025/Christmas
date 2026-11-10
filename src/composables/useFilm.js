import { onMounted, onUnmounted, watch } from 'vue'
import gsap from 'gsap'
import { useExperience } from './useExperience.js'

/**
 * One entrance timeline per act, played exactly once when the act becomes
 * current. No ScrollTrigger, no scrub, no per-frame filters: while a scene is
 * simply being looked at, the only motion is a CSS keyframe on the plate and
 * a CSS-variable pointer parallax. That is the whole performance story.
 */
export function useFilmTimeline({ index, root, build }) {
  const { state } = useExperience()
  let ctx = null
  let intro = null

  const enter = () => {
    if (!intro || !root.value) return
    if (state.reducedMotion) {
      intro.progress(1).pause()
      gsap.set(root.value, { autoAlpha: 1 })
      return
    }
    intro.restart(true)
  }

  const leave = () => {
    if (!root.value) return
    if (intro) intro.pause()
    // Hidden underneath the black splice — no visible cut.
    gsap.set(root.value, { autoAlpha: 0 })
  }

  const stopWatch = watch(() => state.activeAct, (now, was) => {
    if (now === index) enter()
    else if (was === index) leave()
  })

  onMounted(() => {
    ctx = gsap.context(() => {
      intro = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } })
      const q = (selector) => root.value.querySelector(selector)
      build(intro, q, root.value)
    }, root.value)

    if (state.activeAct === index) enter()
    else leave()
  })

  onUnmounted(() => {
    stopWatch()
    if (ctx) ctx.revert()
  })
}

export { gsap }
