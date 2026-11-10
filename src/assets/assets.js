/**
 * Unified asset map — the single source of truth for every visual/audio file.
 * Content-based, NOT filename-based: several originals are misnamed.
 * See ASSET_INVENTORY.md for the full inspection notes.
 */
const BASE = '/assets/christmas/derived'

export const SCENES = {
  arrival: `${BASE}/scenes/final.webp`,       // aurora valley — widest establishing shot
  town: `${BASE}/scenes/street.webp`,         // snowy shopping street
  tree: `${BASE}/scenes/tree.webp`,           // the great Christmas tree
  cabin: `${BASE}/scenes/cabin.webp`,         // fireplace interior
  letters: `${BASE}/overlays/forest.webp`,    // "forest.png" is actually a full scene
  finale: `${BASE}/scenes/opening.webp`,      // cathedral square under the moon
}

export const CUTOUTS = {
  bell: `${BASE}/cutouts/bell.webp`,
  bow: `${BASE}/cutouts/velvet-bow.webp`,
  pine: `${BASE}/cutouts/pine-branch.webp`,
  wreath: `${BASE}/cutouts/wreath.webp`,
  vinyl: `${BASE}/cutouts/vinyl.webp`,
  goldenStar: `${BASE}/cutouts/golden-star.webp`,
  star: `${BASE}/cutouts/star.webp`,
}

export const PLATES = {
  envelope: `${BASE}/plates/envelope.webp`,
  giftBox: `${BASE}/plates/gift-box.webp`,
  key: `${BASE}/plates/key.webp`,
  ornament: `${BASE}/plates/ornament.webp`,
  snowflake: `${BASE}/plates/snowflake-ornament.webp`,
  starOnBlack: `${BASE}/plates/star-on-black.webp`,
  candle: `${BASE}/plates/candle.webp`,
  giftClosed: `${BASE}/plates/gift-closed.webp`,
  giftOpen: `${BASE}/plates/gift-open.webp`,
  letterClosed: `${BASE}/plates/letter-closed.webp`,
  letterOpen: `${BASE}/plates/letter-open.webp`,
  goldenStarPlate: `${BASE}/plates/golden-star-plate.webp`,
}

export const OVERLAYS = {
  bokeh: `${BASE}/overlays/bokeh.webp`,
  moonForest: `${BASE}/overlays/film-grain.webp`, // misnamed: moonbeams through a forest
  fog: `${BASE}/overlays/fog.webp`,
  forest: `${BASE}/overlays/forest.webp`,
  goldenDust: `${BASE}/overlays/golden-dust.webp`,
}

export const FLAKES = [
  `${BASE}/particles/snowflake-01.webp`,
  `${BASE}/particles/snowflake-02.webp`,
  `${BASE}/particles/snowflake-03.webp`,
]

/**
 * ACT III music box. The visitor-supplied photographs are pure format
 * transcodes of the originals (same pixels, no crop / grading / recolour).
 * `open.webp` already had real transparency; the other two came on white, so
 * scripts/derive_musicbox_alpha.py derives an alpha channel from their own
 * pixels. No new visual content is generated. The ballerina and winding-key
 * cut-out plates were removed — the open photograph already carries its own
 * interior (snowy town, figurine and key drawn in).
 * See ASSET_INVENTORY.md for the original filenames and inspection notes.
 */
export const MUSIC_BOX = {
  closed: '/assets/christmas/musicbox/closed.webp',
  open: '/assets/christmas/musicbox/open.webp',
  lid: '/assets/christmas/musicbox/lid.webp',
}

export const AUDIO = {
  // Visitor-supplied track, 3:20, M4A/AAC audio (no video stream).
  // Kept under its original filename on purpose — see ASSET_INVENTORY.md.
  music: '/assets/christmas/audio/A Letter I Never Sent.mp4',
  ambience: '/assets/christmas/audio/cold-wind-breeze-ambience-8e383c41.mp3',
  // The ACT III music box has its own independent record. This is the single
  // place to change when replacing the melody: 3:04, M4A/AAC, no video.
  musicBox: '/assets/christmas/audio/Snowflakes & Unspoken Love.mp4',
}

export const ACTS = [
  { id: 'arrival', numeral: 'I',    title: 'THE ARRIVAL',            cn: '雪夜抵达',   kicker: 'ACT I' },
  { id: 'town',    numeral: 'II',   title: 'CHRISTMAS TOWN',         cn: '不敢回望',   kicker: 'ACT II' },
  { id: 'tree',    numeral: 'III',  title: 'THE CHRISTMAS TREE',     cn: '留一盏灯',   kicker: 'ACT III' },
  { id: 'cabin',   numeral: 'IV',   title: 'THE CHRISTMAS CABIN',    cn: '一室沉默',   kicker: 'ACT IV' },
  { id: 'letters', numeral: 'V',    title: 'LETTERS TO CHRISTMAS',   cn: '未寄之信',   kicker: 'ACT V' },
  { id: 'finale',  numeral: 'VI',   title: 'A NIGHT TO REMEMBER',    cn: '话未说完',   kicker: 'ACT VI' },
]

export const ACT_COUNT = ACTS.length
