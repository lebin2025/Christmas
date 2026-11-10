import { ref } from 'vue'
// Vite resolves this to a hashed, base-aware asset URL at build time, so the
// wasm loads correctly in both `vite dev` and a GitHub Pages deployment.
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'

/**
 * Client-side SQLite, persisted to IndexedDB. The whole film stays a static
 * site (no server) — the SQLite database file is simply saved as a blob in
 * IndexedDB and reloaded on the next visit. This replaces the old
 * localStorage persistence for wishes and the unspoken count.
 *
 * If sql.js or IndexedDB is unavailable (e.g. strict private mode), every
 * function transparently falls back to localStorage so the experience never
 * breaks — we just lose cross-session durability in that one edge case.
 */

const IDB_NAME = 'magic-of-christmas'
const IDB_STORE = 'sqlite'
const IDB_BLOB_KEY = 'db'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS wishes (
    id  TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kv (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`

let SQL = null
let db = null
let ready = ref(false)
let failed = false

/* ------------------------------------------------------------------ *
 * IndexedDB helpers (tiny promise wrappers)
 * ------------------------------------------------------------------ */
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
function idbGet() {
  return idb().then(
    (c) =>
      new Promise((resolve, reject) => {
        const tx = c.transaction(IDB_STORE, 'readonly')
        const r = tx.objectStore(IDB_STORE).get(IDB_BLOB_KEY)
        r.onsuccess = () => resolve(r.result || null)
        r.onerror = () => reject(r.error)
      }),
  )
}
function idbSet(bytes) {
  return idb().then(
    (c) =>
      new Promise((resolve, reject) => {
        const tx = c.transaction(IDB_STORE, 'readwrite')
        tx.objectStore(IDB_STORE).put(bytes, IDB_BLOB_KEY)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

/* ------------------------------------------------------------------ *
 * SQLite lifecycle
 * ------------------------------------------------------------------ */
async function ensure() {
  if (db) return db
  if (failed) return null
  try {
    if (!SQL) {
      // sql.js is dynamically imported so its ~280 KB never sits in the
      // first-paint bundle; the 685 KB wasm it then fetches is itself deferred
      // until the first real DB use (the idle hydration in useExperience).
      const sqlJs = await import('sql.js')
      SQL = await sqlJs.default({ locateFile: () => wasmUrl })
    }
    const bytes = await idbGet()
    if (bytes) {
      db = new SQL.Database(new Uint8Array(bytes))
    } else {
      db = new SQL.Database()
      db.run(SCHEMA)
      await persist()
    }
    ready.value = true
    return db
  } catch (err) {
    failed = true
    console.warn('[db] SQLite init failed, using localStorage fallback:', err)
    return null
  }
}

/**
 * Flush the current SQLite file to IndexedDB. The database is tiny (a few
 * dozen rows at most), so `export()` is cheap and we persist on every write
 * with no debounce — durability must not depend on a timer surviving a
 * navigation or context close.
 */
function persist() {
  if (!db) return Promise.resolve()
  return idbSet(db.export()).catch(() => {})
}

/* ------------------------------------------------------------------ *
 * localStorage fallback (only used when SQLite is unavailable)
 * ------------------------------------------------------------------ */
const LS_WISH = 'magic-of-christmas.wishes'
const LS_UNSPOKEN = 'magic-of-christmas.unspoken'
const lsGet = (k, d) => {
  try {
    return localStorage.getItem(k) ?? d
  } catch {
    return d
  }
}
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ *
 * Public API — wishes
 * ------------------------------------------------------------------ */
export async function dbGetWishes() {
  const d = await ensure()
  if (!d) {
    try {
      return JSON.parse(lsGet(LS_WISH, '[]'))
    } catch {
      return []
    }
  }
  const res = d.exec('SELECT id, text, at FROM wishes ORDER BY rowid DESC LIMIT 24')
  if (!res.length) return []
  return res[0].values.map(([id, text, at]) => ({ id, text, at }))
}

export async function dbAddWish({ id, text, at }) {
  const d = await ensure()
  if (!d) {
    const arr = (() => {
      try {
        return JSON.parse(lsGet(LS_WISH, '[]'))
      } catch {
        return []
      }
    })()
    arr.unshift({ id, text, at })
    lsSet(LS_WISH, JSON.stringify(arr.slice(0, 24)))
    return
  }
  d.run('INSERT OR REPLACE INTO wishes (id, text, at) VALUES (?, ?, ?)', [id, text, at])
  await persist()
}

export async function dbRemoveWish(id) {
  const d = await ensure()
  if (!d) {
    const arr = (() => {
      try {
        return JSON.parse(lsGet(LS_WISH, '[]'))
      } catch {
        return []
      }
    })()
    lsSet(LS_WISH, JSON.stringify(arr.filter((w) => w.id !== id)))
    return
  }
  d.run('DELETE FROM wishes WHERE id = ?', [id])
  await persist()
}

/* ------------------------------------------------------------------ *
 * Public API — unspoken count (single KV row)
 * ------------------------------------------------------------------ */
export async function dbGetUnspoken() {
  const d = await ensure()
  if (!d) return Number(lsGet(LS_UNSPOKEN, '0')) || 0
  const res = d.exec("SELECT value FROM kv WHERE key = 'unspoken'")
  return res.length ? Number(res[0].values[0][0]) || 0 : 0
}

export async function dbSetUnspoken(n) {
  const d = await ensure()
  if (!d) {
    lsSet(LS_UNSPOKEN, String(n))
    return
  }
  d.run("INSERT OR REPLACE INTO kv (key, value) VALUES ('unspoken', ?)", [String(n)])
  await persist()
}

export function dbReady() {
  return ready
}
