<script setup>
import { ref } from 'vue'
import { gsap, useFilmTimeline } from '../composables/useFilm.js'
import { useExperience } from '../composables/useExperience.js'

const props = defineProps({
  index: { type: Number, required: true },
  image: { type: String, required: true },
  numeral: { type: String, default: 'I' },
  kicker: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  lede: { type: String, default: '' },
  hint: { type: String, default: '' },
  centered: { type: Boolean, default: false },
  stageClass: { type: String, default: '' },
  objectPosition: { type: String, default: '' },
  lightPosition: { type: String, default: 'left: 8%; top: 18%;' },
  extra: { type: Function, default: null },
})
const emit = defineEmits(['loaded'])
const { state } = useExperience()

const root = ref(null)
const isActive = (i) => state.activeAct === i

/**
 * One entrance, played once when the act is projected. Transform + opacity
 * only — the old scroll version animated blur() every frame on six full-screen
 * layers, which is exactly what made scrubbing feel sticky.
 */
function build(tl, q, rootEl) {
  const img = q('.js-image')
  const reveals = rootEl.querySelectorAll('.js-reveal')
  const interaction = q('.js-interaction')

  // Resolve out of the black splice.
  tl.fromTo(rootEl, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.95, ease: 'power2.out' }, 0)

  // A single slow dolly settling into the shot (2.6s, transform only).
  if (img) {
    tl.fromTo(img, { scale: 1.065, yPercent: 0.7 },
      { scale: 1, yPercent: 0, duration: 2.6, ease: 'power2.out' }, 0)
  }

  if (reveals.length) {
    tl.fromTo(reveals, { autoAlpha: 0, y: 28 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, 0.26)
  }
  if (interaction) {
    tl.fromTo(interaction, { autoAlpha: 0, y: 24 },
      { autoAlpha: 1, y: 0, duration: 0.85, ease: 'power3.out' }, 0.52)
  }

  if (typeof props.extra === 'function') props.extra(tl, q, rootEl, gsap)
}

useFilmTimeline({ index: props.index, root, build })
</script>

<template>
  <section
    ref="root"
    class="scene"
    :class="[{ 'is-active': isActive(index) }, centered ? 'scene--centered' : '']"
    :data-act="index"
    :aria-label="`ACT ${numeral} — ${title}`"
  >
    <div class="scene__background">
      <div class="scene__plate js-plate">
        <img
          class="scene__image js-image"
          :src="image"
          :style="objectPosition ? { objectPosition } : null"
          :alt="`${title} 场景`"
          draggable="false"
          @load="emit('loaded', image)"
        />
        <div class="scene__grade"></div>
      </div>
      <div class="scene__light" :style="lightPosition"></div>
    </div>

    <div class="scene__atmosphere"><slot name="atmosphere" /></div>
    <div class="scene__mid"><slot name="mid" /></div>

    <div class="scene__stage" :class="stageClass">
      <slot name="stage">
        <div class="scene__chapter js-reveal">
          <span class="act-numeral">{{ kicker }} &nbsp;·&nbsp; ACT {{ numeral }}</span>
          <p class="eyebrow" v-if="eyebrow">{{ eyebrow }}</p>
          <h2 class="scene-title js-title">
            {{ title }}<em v-if="subtitle">{{ subtitle }}</em>
          </h2>
          <p class="scene-lede" v-if="lede">{{ lede }}</p>
          <div class="gold-rule"></div>
          <div class="scene__hint" v-if="hint">{{ hint }}</div>
          <slot />
        </div>
        <div class="scene__interaction js-interaction"><slot name="interaction" /></div>
      </slot>
    </div>

    <div class="scene__foreground"><slot name="foreground" /></div>
    <div class="scene__vignette"></div>
    <div class="scene__fade"></div>
  </section>
</template>
