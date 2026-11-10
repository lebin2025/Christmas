<script setup>
import { computed } from 'vue'
import SceneShell from '../components/SceneShell.vue'
import { SCENES, PLATES, OVERLAYS, CUTOUTS } from '../assets/assets.js'
import { useExperience } from '../composables/useExperience.js'
import { useAudio } from '../composables/useAudio.js'

const { state, goToAct, draftLetter, almostSay } = useExperience()
const audio = useAudio()
const playing = computed(() => audio.isPlaying.value)
const progress = computed(() => audio.progress.value)

function toggleGift() { state.giftOpened = !state.giftOpened }

/* The line inside the box is too shy to be delivered in person. */
function sendGiftLine() {
  draftLetter('其实我……算了，圣诞快乐。')
  almostSay('我把它交给圣诞，因为不敢交给你。')
  goToAct(4)
}
</script>

<template>
  <SceneShell
    :index="3"
    :image="SCENES.cabin"
    numeral="IV"
    kicker="ACT IV"
    eyebrow="A SILENCE WARM ENOUGH"
    title="THE CHRISTMAS CABIN"
    subtitle="火很暖，你很近，话很远"
    lede="屋外是整片冬天，屋里只装得下这点火光。唱片转完，谁也没开口。"
    hint="TOUCH THE GIFT · SAY NOTHING"
    object-position="50% 50%"
    light-position="left: 8%; top: 32%;"
  >
    <template #atmosphere>
      <img class="atmo cabin__bokeh" :src="OVERLAYS.bokeh" alt="" />
      <div class="cabin__firelight"></div>
    </template>

    <template #mid>
      <div class="cabin__candle">
        <div class="plate"><img :src="PLATES.candle" alt="燃烧的蜡烛" /></div>
      </div>
    </template>

    <template #interaction>
      <div class="cabin__gift">
        <button
          class="cabin__gift-stage"
          :class="{ 'is-open': state.giftOpened }"
          :aria-label="state.giftOpened ? '合上礼物盒' : '拆开礼物盒'"
          @click="toggleGift"
        >
          <img class="cabin__gift-img cabin__gift-img--closed" :src="PLATES.giftClosed" alt="合上的红色礼物盒" />
          <img class="cabin__gift-img cabin__gift-img--open" :src="PLATES.giftOpen" alt="打开的礼物盒，金色光粒涌出" />
          <span class="cabin__spark" v-for="n in 9" :key="n" :style="{ '--i': n }"></span>
        </button>
        <p class="cabin__gift-caption">
          {{ state.giftOpened ? '「其实我……算了，圣诞快乐。」' : '没有署名。收件人我也不敢写。' }}
        </p>
        <button class="cabin__send" v-if="state.giftOpened" @click="sendGiftLine">✉ 让圣诞替我转交 →</button>
        <span class="act-numeral" v-else>A GIFT, UNOPENED</span>
      </div>

      <div class="gramophone">
        <div class="gramophone__disc" :class="{ 'is-spinning': playing }">
          <img :src="CUTOUTS.vinyl" alt="黑胶唱片" />
        </div>
        <div class="gramophone__meta">
          <span class="act-numeral">NOW PLAYING · ON LOOP</span>
          <p>A Letter I Never Sent</p>
          <div class="gramophone__progress"><i :style="{ width: (progress * 100).toFixed(1) + '%' }"></i></div>
        </div>
        <div class="gramophone__controls">
          <button class="gramophone__btn" :aria-label="playing ? '暂停唱片' : '播放唱片'" @click="audio.toggle()">
            {{ playing ? '❚❚' : '▶' }}
          </button>
          <button class="gramophone__btn gramophone__btn--small" aria-label="从头播放" @click="audio.restart()">↺</button>
        </div>
      </div>
    </template>

    <template #default>
      <button class="chip cabin__next" @click="goToAct(4)">✦ &nbsp;有些话，还是写下来吧</button>
    </template>

    <template #foreground>
      <div class="depth-object cabin__pine"><img :src="CUTOUTS.pine" alt="" /></div>
      <div class="depth-object cabin__bow"><img :src="CUTOUTS.bow" alt="" /></div>
    </template>
  </SceneShell>
</template>

<style scoped>
.cabin__bokeh { opacity: 0.055; animation: slow-drift 22s ease-in-out infinite; }
.cabin__firelight {
  position: absolute; left: 6%; bottom: -6%; width: 62vw; height: 62vh;
  background: radial-gradient(ellipse at 30% 80%, rgba(255, 146, 55, 0.26), transparent 65%);
  mix-blend-mode: screen; animation: candle-flicker 5.5s ease-in-out infinite;
}

.cabin__candle { position: absolute; right: 5%; bottom: -4%; width: clamp(120px, 14vw, 220px); }
.cabin__candle .plate { aspect-ratio: 1; }
.cabin__candle img { animation: candle-flicker 4.2s ease-in-out infinite; }

.cabin__gift { display: flex; flex-direction: column; align-items: center; gap: 0.55rem; text-align: center; }
.cabin__gift-stage {
  position: relative; width: clamp(190px, 21vw, 310px); aspect-ratio: 1;
  filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.65));
  transition: transform 0.9s var(--ease-film);
}
.cabin__gift-stage:hover { transform: translateY(-6px) scale(1.035); filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.65)) brightness(1.14); }
.cabin__gift-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 1s var(--ease-soft), transform 1.1s var(--ease-film); }
.cabin__gift-img--open { opacity: 0; transform: scale(1.1) translateY(-5%); }
.cabin__gift-stage.is-open .cabin__gift-img--closed { opacity: 0; transform: scale(0.92) translateY(8%); }
.cabin__gift-stage.is-open .cabin__gift-img--open { opacity: 1; transform: scale(1) translateY(0); }

.cabin__spark {
  position: absolute; left: 50%; top: 46%; width: 4px; height: 4px; border-radius: 50%;
  background: #ffe6ab; box-shadow: 0 0 12px 3px rgba(255, 205, 120, 0.9);
  opacity: 0; pointer-events: none;
}
.cabin__gift-stage.is-open .cabin__spark {
  animation: dust-rise 2.4s var(--ease-soft) infinite;
  animation-delay: calc(var(--i) * 0.19s);
  left: calc(32% + var(--i) * 4%);
}
.cabin__gift-caption { margin: 0; font-family: var(--font-elegant); font-size: 1.1rem; font-style: italic; color: var(--gold-100); }
.cabin__gift .act-numeral { font-size: 0.54rem; letter-spacing: 0.28em; }
/* The line in the box can be handed to Christmas, but never to that person. */
.cabin__send {
  font-family: var(--font-cn); font-size: 0.66rem; letter-spacing: 0.14em;
  color: #ffe6bd;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.95);
  padding: 0.1rem 0.2rem 0.3rem;
  border-bottom: 1px solid rgba(232, 200, 138, 0.5);
  transition: color 0.35s, border-color 0.35s;
}
.cabin__send:hover { color: #fff8e8; border-color: var(--gold-100); }
.cabin__next { margin-top: 1.6rem; }

.gramophone {
  display: flex; align-items: center; gap: 0.9rem; width: min(34vw, 460px);
  padding: 0.7rem 0.85rem;
  border: 1px solid rgba(232, 200, 138, 0.2);
  background: linear-gradient(140deg, rgba(22, 18, 20, 0.72), rgba(8, 10, 18, 0.78));
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 3px;
}
.gramophone__disc { width: 54px; height: 54px; flex: 0 0 54px; filter: drop-shadow(0 4px 14px rgba(0,0,0,0.8)); }
.gramophone__disc img { width: 100%; height: 100%; }
.gramophone__disc.is-spinning img { animation: spin-slow 3.6s linear infinite; }
.gramophone__meta { flex: 1; min-width: 0; text-align: left; }
.gramophone__meta .act-numeral { font-size: 0.48rem; letter-spacing: 0.18em; display: block; }
.gramophone__meta p { margin: 0.25rem 0 0.45rem; font-family: var(--font-elegant); font-size: 0.95rem; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gramophone__progress { height: 1px; background: rgba(232, 200, 138, 0.16); }
.gramophone__progress i { display: block; height: 100%; background: var(--gold-300); box-shadow: 0 0 6px var(--gold-300); }
.gramophone__controls { display: flex; gap: 0.3rem; }
.gramophone__btn {
  width: 34px; height: 34px; border-radius: 50%;
  border: 1px solid rgba(232, 200, 138, 0.34);
  color: var(--gold-100); font-size: 0.7rem;
  display: grid; place-items: center;
  transition: all 0.35s var(--ease-soft);
}
.gramophone__btn:hover { background: rgba(232, 200, 138, 0.14); box-shadow: 0 0 16px rgba(232, 200, 138, 0.28); }
.gramophone__btn--small { font-size: 1rem; }

.cabin__pine { width: clamp(170px, 20vw, 320px); left: -8%; bottom: -18%; transform: rotate(-30deg); opacity: 0.5; }
.cabin__bow { width: clamp(90px, 10vw, 160px); right: 14%; top: 8%; transform: rotate(14deg); opacity: 0.6; filter: drop-shadow(0 12px 26px rgba(0,0,0,0.8)); }

@media (max-width: 900px) {
  .cabin__candle, .cabin__bow { display: none; }
  .cabin__pine { width: 170px; opacity: 0.3; }
  .cabin__gift-stage { width: clamp(160px, 42vw, 230px); }
  .cabin__next { margin-top: 0.9rem; }
  .gramophone { width: min(78vw, 400px); padding: 0.55rem; }
  .gramophone__disc { width: 44px; height: 44px; flex-basis: 44px; }
}
@media (max-width: 480px) {
  .cabin__gift-stage { width: 155px; }
  .cabin__gift-caption { font-size: 0.92rem; }
  .gramophone { gap: 0.55rem; }
  .gramophone__meta p { font-size: 0.82rem; }
  .gramophone__btn { width: 30px; height: 30px; }
}
</style>
