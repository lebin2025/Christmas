import { chromium } from 'playwright-core'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const URL = process.env.QA_URL || 'http://localhost:5173/'
const OUT = path.resolve('.workbuddy/tmp/qa')
await fs.mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const errors = []
const failed = []
const mediaProbes = []
const report = { scenes: [], interactions: {}, mobile: {}, errors, failed, mediaProbes }

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  // Keep acceptance runs offline-safe: a pending Google Fonts stylesheet makes
  // document.fonts.ready hang, and page.screenshot() waits for it forever.
  // The site itself keeps its real fonts; only the QA browser stubs them.
  await ctx.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '/* offline QA */' }))
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()} @ ${m.location().url || '?'}`) })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('requestfailed', (r) => {
    const url = r.url()
    const err = r.failure()?.errorText
    // An HTML5 <audio> element cancels its first metadata probe and re-issues
    // a Range request by design. That abort is not a broken asset.
    if (err === 'net::ERR_ABORTED' && /\/audio\//.test(url)) {
      mediaProbes.push(`${url} :: ${err}`)
      return
    }
    failed.push(`${url} :: ${err}`)
  })
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
  // Google Fonts can keep a request pending forever in headless Chrome, so
  // never wait for networkidle — wait for the app itself to be ready.
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(() => Boolean(window.__christmas), null, { timeout: 20000 })
  await page.waitForTimeout(1800)
  return { ctx, page }
}

/** Turn the page like a human: veil + one entrance timeline. */
async function turnTo(page, i, wait = 1750) {
  await page.evaluate((n) => window.__christmas.goToAct(n), i)
  await page.waitForTimeout(wait)
}

const { ctx, page } = await newPage({ width: 1440, height: 900 })
const actCount = await page.evaluate(() => window.__christmas.ACT_COUNT)
report.sceneImagesLoaded = await page.evaluate(() => window.__christmas.loaded.length)
report.noScroll = await page.evaluate(() => ({
  spacerRemoved: !document.querySelector('#scroll-spacer'),
  docScrollHeightOverflow: document.documentElement.scrollHeight - window.innerHeight,
  bodyOverflow: getComputedStyle(document.body).overflow,
}))

// ---- frame health: long tasks while idle and during a page turn ---------
async function measureLongTasks(page, turn) {
  await page.evaluate(() => {
    window.__lt?.disconnect()
    window.__longTasks = []
    window.__lt = new PerformanceObserver((list) => {
      list.getEntries().forEach((e) => window.__longTasks.push(Math.round(e.duration)))
    })
    try { window.__lt.observe({ entryTypes: ['longtask'] }) } catch { /* unsupported */ }
  })
  if (turn) await page.evaluate(() => window.__christmas.goToAct(2))
  await page.waitForTimeout(2500)
  return page.evaluate(() => {
    window.__lt?.disconnect()
    const t = window.__longTasks || []
    return { count: t.length, maxMs: t.length ? Math.max(...t) : 0, totalMs: t.reduce((a, b) => a + b, 0) }
  })
}
report.frameHealth = {
  idle: await measureLongTasks(page, false),
  duringPageTurn: await measureLongTasks(page, true),
}

for (let i = 0; i < actCount; i++) {
  await turnTo(page, i)
  const info = await page.evaluate(() => {
    const scenes = [...document.querySelectorAll('.scene')]
    const visible = scenes.filter((s) => {
      const cs = getComputedStyle(s)
      return cs.visibility !== 'hidden' && Number(cs.opacity) > 0.5
    }).length
    return {
      active: window.__christmas.state.activeAct,
      visibleScenes: visible,
      brokenImages: [...document.images].filter((im) => !im.complete || im.naturalWidth === 0).map((im) => im.currentSrc || im.src),
      imageCount: document.images.length,
      title: document.querySelector(`.scene[data-act="${window.__christmas.state.activeAct}"] .scene-title`)?.innerText?.slice(0, 60) || '',
    }
  })
  report.scenes.push({ act: i + 1, ...info })
  await page.screenshot({ path: path.join(OUT, `act-${i + 1}.png`) })
}

// ---- interactions -------------------------------------------------------
// navigation dot
await page.locator('.act-nav button').nth(2).click()
await page.waitForTimeout(1400)
report.interactions.navJump = await page.evaluate(() => window.__christmas.state.activeAct)

// wheel: one gesture turns exactly one page
await page.mouse.move(720, 450)
await page.mouse.wheel(0, 160)
await page.waitForTimeout(1400)
report.interactions.wheelTurn = await page.evaluate(() => window.__christmas.state.activeAct)

// keyboard: arrow up goes back one page
await page.keyboard.press('ArrowUp')
await page.waitForTimeout(1400)
report.interactions.keyTurn = await page.evaluate(() => window.__christmas.state.activeAct)

// console next button + auto-screening toggle / human takeover
await page.locator('.film-console__arrow--next').click()
await page.waitForTimeout(1300)
report.interactions.consoleNext = await page.evaluate(() => window.__christmas.state.activeAct)
await page.locator('.film-console__auto').click()
report.interactions.autoPlayOn = await page.evaluate(() => window.__christmas.state.autoPlay)
await page.locator('.film-console__arrow--next').click()
await page.waitForTimeout(1300)
report.interactions.autoPlayCancelledByManual = await page.evaluate(() => !window.__christmas.state.autoPlay)

// tree lights
await turnTo(page, 2)
const before = await page.locator('.tree-lights').getAttribute('class')
await page.locator('.tree-light').first().click({ force: true })
await page.waitForTimeout(250)
const after = await page.locator('.tree-lights').getAttribute('class')
report.interactions.treeLightsToggle = `${before} -> ${after}`

// gift
await turnTo(page, 3)
await page.locator('.cabin__gift-stage').click({ force: true })
await page.waitForTimeout(400)
report.interactions.giftOpened = await page.locator('.cabin__gift-stage').getAttribute('class')

// gramophone + music controller — the visitor's own track must really play
await page.locator('.gramophone__btn').first().click({ force: true })
await page.waitForTimeout(1100)
report.interactions.gramophonePlaying = await page.evaluate(() => window.__christmas.state.soundOn)
report.interactions.musicSrc = await page.evaluate(() => window.__christmas.musicSrc)
report.interactions.ambienceDefault = await page.evaluate(() => window.__christmas.state.ambienceOn)
report.interactions.musicDuration = await page.evaluate(() => window.__christmas.audio.duration())
report.interactions.musicReady = await page.evaluate(() => window.__christmas.audio.isReady.value)
report.interactions.musicIsPlaying = await page.evaluate(() => window.__christmas.audio.isPlaying.value)
report.interactions.gramophoneTrack = await page.locator('.gramophone__meta p').innerText()
await page.locator('.music__orb').click()
await page.waitForTimeout(450)
report.interactions.musicPanelOpen = await page.locator('.music__panel').count()
report.interactions.musicTrackLabel = await page.locator('.music__track').innerText()
const slider = page.locator('.music__slider input')
await slider.fill('0.25')
report.interactions.volume = await page.evaluate(() => window.__christmas.state.volume)
await page.locator('.music__toggles .chip').nth(1).click()
report.interactions.snowOff = await page.evaluate(() => window.__christmas.state.snowEnabled)
await page.locator('.music__toggles .chip').nth(1).click()
await page.locator('.music__close').click()

// letter + wish persistence
await turnTo(page, 4)
await page.locator('.letter__seal').click({ force: true })
await page.waitForTimeout(300)
await page.locator('.letter__paper textarea').fill('愿今年的雪，落在该落的地方。')
await page.getByRole('button', { name: /SEAL THE WISH/ }).click()
await page.waitForTimeout(300)
report.interactions.savedWishes = await page.evaluate(() => window.__christmas.state.wishes.length)
report.interactions.localStorage = await page.evaluate(() => (localStorage.getItem('magic-of-christmas.wishes') || '').slice(0, 80))

// the sealed line stays on the paper, in handwriting tilted with the sheet
await page.waitForTimeout(1200)
report.interactions.letterInk = await page.locator('.letter__ink p').innerText()
report.interactions.letterTilt = await page.locator('.letter__paper').evaluate((el) => getComputedStyle(el).transform)
report.interactions.letterItalic = await page.locator('.letter__ink p').evaluate((el) => getComputedStyle(el).fontStyle)
await page.screenshot({ path: path.join(OUT, 'interaction-letter.png') })

// write a second line, then pick the earlier one back from the shelf
await page.getByRole('button', { name: /WRITE AGAIN/ }).click()
report.interactions.backToWrite = await page.locator('.letter__paper textarea').count()
await page.locator('.letter__paper textarea').fill('愿炉火一直温着，等所有晚归的人。')
await page.getByRole('button', { name: /SEAL THE WISH/ }).click()
await page.waitForTimeout(300)
report.interactions.shelfTabs = await page.locator('.wish-tab').count()
await page.locator('.wish-tab__main').last().click()
await page.waitForTimeout(1200)
report.interactions.pickedInk = await page.locator('.letter__ink p').innerText()
report.interactions.pickedTab = await page.locator('.wish-tab.is-picked').count()
await page.waitForTimeout(1700)
await page.screenshot({ path: path.join(OUT, 'interaction-letter-picked.png') })

// closing the letter, then picking a slip, reopens it with that line on top
await page.getByRole('button', { name: /折好信纸/ }).click()
await page.waitForTimeout(350)
report.interactions.closedHasPaper = await page.locator('.letter__paper').count()
await page.locator('.wish-tab__main').first().click()
await page.waitForTimeout(1200)
report.interactions.reopenedByPick = await page.locator('.letter__ink p').count()
// deleting the line currently on the paper falls back to a blank page
await page.locator('.wish-tab.is-picked .wish-tab__del').click()
await page.waitForTimeout(350)
report.interactions.afterDeleteTextarea = await page.locator('.letter__paper textarea').count()

// the unspoken note: hover unfolds / leave folds / click pins / rounded corners
const orb = page.locator('.music__orb')
await orb.hover()
await page.waitForTimeout(550)
report.interactions.hoverOpened = await page.locator('.music__panel').count()
report.interactions.hoverCompact = await page.locator('.music__panel .music__sound').count()
report.interactions.hoverClearsTitle = await page.evaluate(() => {
  const p = document.querySelector('.music__panel')?.getBoundingClientRect()
  const t = document.querySelector('.scene.is-active .js-title')?.getBoundingClientRect()
  return Boolean(p && t && p.top > t.bottom)
})
await page.screenshot({ path: path.join(OUT, 'interaction-unspoken-hover.png') })
await page.mouse.move(720, 500)
await page.waitForTimeout(550)
report.interactions.hoverClosed = await page.locator('.music__panel').count()
await orb.click()
await page.waitForTimeout(550)
report.interactions.clickPinned = await page.locator('.music__panel').count()
report.interactions.pinnedHasSound = await page.locator('.music__panel .music__sound').count()
report.interactions.orbRadius = await orb.evaluate((el) => getComputedStyle(el).borderRadius)
report.interactions.panelRadius = await page.locator('.music__panel').evaluate((el) => getComputedStyle(el).borderRadius)
await page.mouse.move(720, 500)
await page.waitForTimeout(550)
report.interactions.pinnedAfterLeave = await page.locator('.music__panel').count()
await page.keyboard.press('Escape')
await page.waitForTimeout(550)
report.interactions.escClosed = await page.locator('.music__panel').count()
await orb.hover()
await page.waitForTimeout(550)
report.interactions.reopenedAfterEsc = await page.locator('.music__panel').count()

// new interactions inside the note: switch verse, almost-confess, send to ACT V
const verseBefore = await page.locator('.music__verse > span').innerText()
await page.locator('.music__verse').click()
await page.waitForTimeout(900)
report.interactions.verseChanged = verseBefore !== (await page.locator('.music__verse > span').innerText())
await page.locator('.music__actions .chip').first().click()
await page.waitForTimeout(350)
report.interactions.whisperShown = await page.locator('.music__whisper').count()
report.interactions.unspokenCount = await page.locator('.music__count').innerText()
await page.screenshot({ path: path.join(OUT, 'interaction-unspoken.png') })
await page.locator('.music__actions .chip').nth(1).click()
await page.waitForTimeout(1700)
report.interactions.letterDraftAct = await page.evaluate(() => window.__christmas.state.activeAct)
report.interactions.letterDraftText = await page.locator('.letter__paper textarea').inputValue()
report.interactions.noteClosedAfterSend = await page.locator('.music__panel').count()
await page.screenshot({ path: path.join(OUT, 'interaction-unspoken-to-letter.png') })

// finale star + return home
await turnTo(page, 5)
report.interactions.finaleStars = await page.locator('.finale__wish').count()
if (report.interactions.finaleStars) {
  await page.locator('.finale__wish').first().click({ force: true })
  report.interactions.selectedWish = await page.locator('.finale__selected').innerText()
}
await page.getByRole('button', { name: /RETURN TO THE BEGINNING/ }).click()
await page.waitForTimeout(1400)
report.interactions.returnHomeAct = await page.evaluate(() => window.__christmas.state.activeAct)

// ---- the unspoken thread: one shared note, six small interactions -------
// ACT I — holding the key tells you why I came early
await turnTo(page, 0)
await page.locator('.arrival__key-plate').hover()
await page.waitForTimeout(250)
report.interactions.keyHoverLine = await page.locator('.arrival__key p').innerText()
await page.locator('.arrival__key-plate').click()
await page.waitForTimeout(300)
report.interactions.keyWhisper = await page.locator('.music__whisper').innerText()
report.interactions.noteAutoOpened = await page.locator('.music__panel').count()
await page.waitForTimeout(1900)

// double-clicking the picture anywhere that is not a control
await page.mouse.dblclick(720, 300)
await page.waitForTimeout(300)
report.interactions.doubleClickWhisper = await page.locator('.music__whisper').innerText()
report.interactions.unspokenTotal = await page.locator('.music__count').innerText()
// A double click used to select a screenful of gold text. Decorative layers
// are now unselectable, and the selection colour itself is almost invisible.
report.interactions.selectionChars = await page.evaluate(() => window.getSelection()?.toString().length ?? 0)
report.interactions.selectionColor = await page.evaluate(() => {
  const el = document.createElement('div')
  el.textContent = 'x'
  document.body.appendChild(el)
  const c = getComputedStyle(el, '::selection').backgroundColor
  el.remove()
  return c
})
// A double click right on the key fires two clicks; only one line should arrive.
const countBefore = Number((await page.locator('.music__count').innerText()).match(/\d+/)?.[0] ?? 0)
await page.locator('.arrival__key-plate').dblclick()
await page.waitForTimeout(250)
const countAfter = Number((await page.locator('.music__count').innerText()).match(/\d+/)?.[0] ?? 0)
report.interactions.keyDblClickIncrement = countAfter - countBefore
report.interactions.keyDblClickWhispers = await page.locator('.music__whisper').count()
report.interactions.keyPlateOpacity = await page.locator('.arrival__key-plate').evaluate((el) => getComputedStyle(el).opacity)
await page.screenshot({ path: path.join(OUT, 'interaction-key-dblclick.png') })
await page.waitForTimeout(2200)
// 1.8s whisper + 0.42s fold-away transition, with a little margin
await page.waitForTimeout(2400)
report.interactions.noteFoldedBack = await page.locator('.music__panel').count()

// ACT II — lighting the window lets a silhouette pass
await turnTo(page, 1)
await page.locator('.town__switch').click()
await page.waitForTimeout(300)
report.interactions.windowShadow = await page.locator('.town__shadow.is-seen').count()
report.interactions.windowWhisper = await page.locator('.music__whisper').innerText()
await page.waitForTimeout(1900)

// ACT III — one light kept for a name I never finished saying
await turnTo(page, 2)
await page.locator('.tree-stage__keep').click({ force: true })
await page.waitForTimeout(300)
report.interactions.keptLight = await page.locator('.tree-light.is-kept').count()
report.interactions.keptCount = await page.locator('.tree-stage__count').innerText()
await page.waitForTimeout(1900)
// and a double-click on any single bulb keeps that particular one
await page.locator('.tree-light').nth(4).dblclick({ force: true })
await page.waitForTimeout(300)
report.interactions.keptBulb = await page.locator('.tree-light.is-kept').count()
report.interactions.keptBulbCount = await page.locator('.tree-stage__count').innerText()
await page.waitForTimeout(1900)

// ---- ACT III: the physical music box, all five states -------------------
const MB = () => page.evaluate(() => {
  const cs = (s, p) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[p] : null }
  const m = window.__musicBox
  return {
    phase: m.phase.value,
    playing: m.box.isPlaying.value,
    current: Math.round(m.box.currentTime.value * 100) / 100,
    duration: m.box.duration.value,
    src: m.box.src,
    closed: cs('.mb__closed', 'opacity'),
    open: cs('.mb__open', 'opacity'),
    lid: cs('.mb__lid', 'transform'),
    push: cs('.scene[data-act="2"] .scene__background', 'transform'),
    player: cs('.mb__player', 'visibility'),
  }
})
report.musicBox = {}
report.musicBox.idle = await MB()
report.musicBox.fivePlates = await page.evaluate(() =>
  [...document.querySelectorAll('.mb__object > img')].map((i) => ({ file: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })))
await page.screenshot({ path: path.join(OUT, 'interaction-music-box-closed.png') })

const objectBefore = await page.locator('.mb__object').evaluate((el) => getComputedStyle(el).transform)
await page.locator('.mb__object').hover()
await page.waitForTimeout(850)
const objectAfter = await page.locator('.mb__object').evaluate((el) => getComputedStyle(el).transform)
report.musicBox.hoverResponds = objectBefore !== objectAfter
await page.mouse.move(720, 500)

await page.locator('.mb__touch').click()
await page.waitForTimeout(420)
report.musicBox.opening = await MB()
await page.screenshot({ path: path.join(OUT, 'interaction-music-box-opening.png') })
await page.waitForTimeout(1700)
report.musicBox.opened = await MB()
report.musicBox.trackTitle = await page.locator('.mb__title').innerText()
report.musicBox.subtitle = await page.locator('.mb__subtitle').innerText()
report.musicBox.totalTime = await page.locator('.mb__times span').last().innerText()
await page.screenshot({ path: path.join(OUT, 'interaction-music-box-open.png') })

await page.locator('.mb__play').click()
await page.waitForTimeout(1500)
const playA = await MB()
await page.waitForTimeout(900)
const playB = await MB()
report.musicBox.playing = playB
report.musicBox.audioActuallyAdvances = playB.current > playA.current
// The site-wide record must be suspended, so two songs never overlap.
report.musicBox.globalSuspended = await page.evaluate(() => !window.__christmas.audio.isPlaying.value)
// Clicking controls must never programmatically scroll the fixed camera.
report.musicBox.noLayoutScroll = await page.evaluate(() =>
  document.querySelector('.scene.is-active')?.scrollTop === 0 &&
  document.querySelector('.camera')?.scrollTop === 0)
await page.screenshot({ path: path.join(OUT, 'interaction-music-box-playing.png') })

await page.locator('.mb__seek').evaluate((el) => {
  el.value = '45'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(400)
report.musicBox.seekedTo = (await MB()).current
await page.locator('.mb__volume input').evaluate((el) => {
  el.value = '0.4'
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
report.musicBox.volume = await page.evaluate(() => window.__musicBox.box.volume.value)

await page.locator('.mb__play').click()
await page.waitForTimeout(650)
const paused = await MB()
await page.waitForTimeout(700)
const stillPaused = await MB()
report.musicBox.paused = paused
report.musicBox.pausedHoldsPosition = Math.abs(stillPaused.current - paused.current) < 0.15
await page.locator('.mb__play').click()
await page.waitForTimeout(800)
report.musicBox.resumed = await MB()

// Playback completion: jump to the last half-second and let the real record
// reach its end. onend resets the playhead and releases the global record.
await page.locator('.mb__seek').evaluate((el) => {
  el.value = String((Number(el.max) || 184) - 0.5)
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.waitForTimeout(2600)
report.musicBox.completed = await MB()
report.musicBox.completionHandled = !report.musicBox.completed.playing && report.musicBox.completed.current < 2

if ((await MB()).playing) {
  await page.locator('.mb__play').click()
  await page.waitForTimeout(500)
}
await page.locator('.mb__close').click()
await page.waitForTimeout(1900)
report.musicBox.closedAgain = await MB()
await page.screenshot({ path: path.join(OUT, 'interaction-music-box-closed-again.png') })

// ACT IV — the line inside the gift travels into the letter
await turnTo(page, 3)
// Leaving ACT III must not leave a record playing, a tween running or a
// camera that stayed pushed in.
report.musicBox.afterLeavingAct = await MB()
if (!(await page.locator('.cabin__send').count())) {
  await page.locator('.cabin__gift-stage').click({ force: true })
  await page.waitForTimeout(300)
}
await page.screenshot({ path: path.join(OUT, 'interaction-gift-open.png') })
await page.locator('.cabin__send').click()
await page.waitForTimeout(1600)
report.interactions.giftToLetterAct = await page.evaluate(() => window.__christmas.state.activeAct)
report.interactions.giftToLetterText = await page.locator('.letter__paper textarea').inputValue()

// ACT V — the addressee is almost written, then taken back
await page.locator('.letter__salutation').click()
await page.waitForTimeout(250)
report.interactions.shySalutation = await page.locator('.letter__salutation').innerText()
await page.waitForTimeout(1700)
report.interactions.salutationRestored = await page.locator('.letter__salutation').innerText()

// ACT VI — reading a star, then putting the words away again
// (the earlier finale test may have left a line already open)
await turnTo(page, 5)
if (!(await page.locator('.finale__selected').count())) {
  await page.locator('.finale__wish').first().click({ force: true })
  await page.waitForTimeout(650)
}
await page.locator('.finale__selected').click()
await page.waitForTimeout(700)
report.interactions.takeBackWhisper = await page.locator('.music__whisper').innerText()
report.interactions.takeBackCleared = await page.locator('.finale__selected').count()
report.interactions.unspokenPersisted = await page.evaluate(() => Number(localStorage.getItem('magic-of-christmas.unspoken')))

await ctx.close()

// ---- mobile --------------------------------------------------------------
const m = await newPage({ width: 390, height: 844 })
report.mobile.viewport = '390x844'
for (const i of [0, 2, 3, 4, 5]) {
  await turnTo(m.page, i)
  report.mobile[`act${i + 1}`] = await m.page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    active: window.__christmas.state.activeAct,
    stageHeight: Math.round(document.querySelector('.scene.is-active .scene__stage')?.getBoundingClientRect().height || 0),
    consoleVisible: Boolean(document.querySelector('.film-console')?.getBoundingClientRect().height),
  }))
  await m.page.screenshot({ path: path.join(OUT, `mobile-act-${i + 1}.png`) })
}

// mobile: the box opens without hover, the player fits and clears the console
await turnTo(m.page, 2)
await m.page.locator('.mb__touch').click()
await m.page.waitForTimeout(2100)
report.mobile.musicBox = await m.page.evaluate(() => {
  const p = document.querySelector('.mb__player')?.getBoundingClientRect()
  const b = document.querySelector('.mb__object')?.getBoundingClientRect()
  const c = document.querySelector('.film-console')?.getBoundingClientRect()
  return {
    phase: window.__musicBox.phase.value,
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
    playerInside: Boolean(p && p.left >= 0 && p.right <= window.innerWidth),
    playerAboveConsole: Boolean(p && c && p.bottom <= c.top + 4),
    boxInside: Boolean(b && b.width > 0 && b.right <= window.innerWidth + 2),
  }
})
await m.page.screenshot({ path: path.join(OUT, 'mobile-music-box-open.png') })

// mobile: a saved line must stay legible on the tilted sheet without overflow
await turnTo(m.page, 4)
await m.page.locator('.letter__seal').click({ force: true })
await m.page.waitForTimeout(300)
await m.page.locator('.letter__paper textarea').fill('愿有人陪我看完这场雪。')
await m.page.getByRole('button', { name: /SEAL THE WISH/ }).click()
await m.page.waitForTimeout(1500)
report.mobile.letterReading = await m.page.evaluate(() => {
  const paper = document.querySelector('.letter__paper')
  const ink = document.querySelector('.letter__ink p')
  const letter = document.querySelector('.letter')
  const p = paper?.getBoundingClientRect()
  const l = letter?.getBoundingClientRect()
  return {
    inkVisible: Boolean(ink && ink.getBoundingClientRect().height > 0),
    inkText: ink?.innerText || '',
    withinLetter: Boolean(p && l && p.left >= l.left - 12 && p.right <= l.right + 12 && p.bottom <= l.bottom + 12),
    overflowX: document.documentElement.scrollWidth - window.innerWidth,
  }
})
await m.page.screenshot({ path: path.join(OUT, 'mobile-act-5-reading.png') })
await m.ctx.close()

// ---- reduced motion: state changes are immediate, no continuous spin -----
const rm = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' })
await rm.route('https://fonts.googleapis.com/**', (r) =>
  r.fulfill({ status: 200, contentType: 'text/css', body: '/* offline QA */' }))
const rp = await rm.newPage()
rp.on('pageerror', (e) => errors.push(`reduced-motion pageerror: ${e.message}`))
await rp.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
await rp.waitForFunction(() => Boolean(window.__christmas && window.__musicBox), null, { timeout: 20000 })
await rp.evaluate(() => window.__christmas.goToAct(2, true))
await rp.waitForTimeout(900)
await rp.locator('.mb__touch').click()
await rp.waitForTimeout(320)
report.reducedMotion = await rp.evaluate(() => ({
  flag: window.__christmas.state.reducedMotion,
  phase: window.__musicBox.phase.value,
  openVisible: getComputedStyle(document.querySelector('.mb__open')).opacity,
  playerVisible: getComputedStyle(document.querySelector('.mb__player')).visibility,
  sparksHidden: getComputedStyle(document.querySelector('.mb__sparks')).display === 'none',
}))
await rp.locator('.mb__close').click()
await rp.waitForTimeout(260)
report.reducedMotion.closedPhase = await rp.evaluate(() => window.__musicBox.phase.value)
await rm.close()

await browser.close()
await fs.writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
