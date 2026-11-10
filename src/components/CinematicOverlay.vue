<script setup>
import { OVERLAYS } from '../assets/assets.js'
</script>

<template>
  <div class="cinematic" aria-hidden="true">
    <!-- warm out-of-focus light, from the real bokeh plate -->
    <div class="cinematic__bokeh" :style="{ backgroundImage: `url(${OVERLAYS.bokeh})` }"></div>
    <div class="cinematic__leak"></div>
    <div class="cinematic__vignette"></div>
    <div class="cinematic__grain"></div>
    <div class="cinematic__bar cinematic__bar--top"></div>
    <div class="cinematic__bar cinematic__bar--bottom"></div>
  </div>
</template>

<style scoped>
.cinematic { position: fixed; inset: 0; z-index: var(--z-overlay); pointer-events: none; }

.cinematic__bokeh {
  position: absolute; inset: -8%;
  background-size: cover; background-position: center;
  mix-blend-mode: screen;
  opacity: 0.055;
  animation: slow-drift 30s ease-in-out infinite;
}

.cinematic__leak {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 40% 55% at 8% 22%, rgba(255, 178, 92, 0.085), transparent 72%),
    radial-gradient(ellipse 34% 46% at 92% 78%, rgba(255, 196, 120, 0.06), transparent 70%);
  mix-blend-mode: screen;
  animation: breath 14s var(--ease-soft) infinite;
}

.cinematic__vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 82% 84% at 50% 48%, transparent 52%, rgba(1, 3, 8, 0.52) 100%);
}

/* procedural film grain — the misnamed film-grain.png is a forest scene */
.cinematic__grain {
  position: absolute; inset: -12%;
  opacity: 0.085;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain-shift 0.9s steps(1) infinite;
}

.cinematic__bar {
  position: absolute; left: 0; right: 0; height: var(--letterbox);
  background: #03050a;
  box-shadow: 0 0 22px rgba(0, 0, 0, 0.85);
}
.cinematic__bar--top {
  top: 0;
  border-bottom: 1px solid rgba(232, 200, 138, 0.055);
}
.cinematic__bar--bottom {
  bottom: 0;
  border-top: 1px solid rgba(232, 200, 138, 0.055);
}

@media (max-width: 760px) {
  .cinematic__bokeh { opacity: 0.04; }
  .cinematic__grain { opacity: 0.07; }
}
</style>
