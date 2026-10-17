// Scent Pick — local persistence and merging the user's changes onto collection.json.
// Pure helpers plus guarded localStorage access: nothing touches `window`/`localStorage` at import time,
// so this module can be imported and tested in Node.
//
// Stored under localStorage['scentpick.v1']:
//   { added: [bottle], removed: [id], edits: {id: partial}, corrections: {id: {hidden, global, <occasionId>: n}},
//     weatherCache: {fetchedAt, hourly} | null, prefs: {weatherOverride?, ...} }

export const STORE_KEY = 'scentpick.v1';
export const STEP_MIN = -2, STEP_MAX = 2;

export const emptyState = () => ({ added: [], removed: [], edits: {}, corrections: {}, weatherCache: null, prefs: {} });
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));

/** The browser's localStorage, or null (Node, private mode, blocked storage). */
export function defaultStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

/** Coerce anything (old/corrupt/imported data) into a valid state object. */
export function normalize(raw) {
  const s = emptyState();
  if (!isObj(raw)) return s;
  if (Array.isArray(raw.added)) s.added = raw.added.filter(b => isObj(b) && typeof b.id === 'string' && b.id);
  if (Array.isArray(raw.removed)) s.removed = [...new Set(raw.removed.filter(x => typeof x === 'string'))];
  if (isObj(raw.edits)) s.edits = raw.edits;
  if (isObj(raw.corrections)) s.corrections = cleanCorrections(raw.corrections);
  if (isObj(raw.weatherCache) && raw.weatherCache.hourly) s.weatherCache = raw.weatherCache;
  if (isObj(raw.prefs)) s.prefs = raw.prefs;
  return s;
}

function cleanCorrections(corr) {
  const out = {};
  for (const [id, c] of Object.entries(corr)) {
    if (!isObj(c)) continue;
    const o = {};
    for (const [k, v] of Object.entries(c)) {
      if (k === 'hidden') { if (v) o.hidden = true; }
      else if (typeof v === 'number' && v) o[k] = clampStep(v);
    }
    if (Object.keys(o).length) out[id] = o;
  }
  return out;
}

export function loadState(storage = defaultStorage()) {
  if (!storage) return emptyState();
  try { return normalize(JSON.parse(storage.getItem(STORE_KEY) || 'null')); } catch { return emptyState(); }
}

/** Returns false when storage is unavailable or full (the app keeps working in memory). */
export function saveState(state, storage = defaultStorage()) {
  if (!storage) return false;
  try { storage.setItem(STORE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

// ---------- corrections (all return a NEW corrections object) ----------
export const clampStep = n => Math.max(STEP_MIN, Math.min(STEP_MAX, Math.round(Number(n) || 0)));
export const getStep = (corr, id, key) => (corr[id] && corr[id][key]) || 0;

function putCorr(corr, id, c) {
  const out = { ...corr };
  if (Object.keys(c).length) out[id] = c; else delete out[id];
  return out;
}
export function setStep(corr, id, key, n) {
  const c = { ...(corr[id] || {}) }, v = clampStep(n);
  if (v) c[key] = v; else delete c[key];
  return putCorr(corr, id, c);
}
/** Thumb up (dir=+1) or down (dir=-1) for an occasion: ±1 step; tapping the same direction again toggles back to 0. */
export function thumb(corr, id, occasionId, dir) {
  const v = getStep(corr, id, occasionId);
  return setStep(corr, id, occasionId, Math.sign(v) === dir ? 0 : v + dir);
}
/** ★ favourite = global +1 (toggle). */
export function toggleFavourite(corr, id) {
  return setStep(corr, id, 'global', getStep(corr, id, 'global') > 0 ? 0 : 1);
}
export function setHidden(corr, id, hidden) {
  const c = { ...(corr[id] || {}) };
  if (hidden) c.hidden = true; else delete c.hidden;
  return putCorr(corr, id, c);
}

// ---------- collection merge ----------
/** Base collection + user's added bottles, edits applied, removed ones flagged `removed: true` (the engine skips them). */
export function mergeCollection(base, st) {
  const removed = new Set(st.removed);
  const all = [...((base && base.bottles) || []), ...st.added.map(b => ({ ...b, userAdded: true }))];
  const seen = new Set();
  const bottles = [];
  for (const b of all) {
    if (seen.has(b.id)) continue; // an added bottle can never shadow a base one
    seen.add(b.id);
    const e = st.edits[b.id];
    const out = isObj(e) ? { ...b, ...e, edited: true } : b;
    bottles.push(removed.has(b.id) ? { ...out, removed: true } : out);
  }
  return { ...(base || {}), bottles };
}

/** Apply an edit: user-added bottles are edited in place, collection bottles via `edits`. Returns a new state. */
export function editBottle(st, id, partial) {
  const s = { ...st };
  const i = s.added.findIndex(b => b.id === id);
  if (i >= 0) { s.added = s.added.slice(); s.added[i] = { ...s.added[i], ...partial }; }
  else s.edits = { ...s.edits, [id]: { ...(s.edits[id] || {}), ...partial } };
  return s;
}
export function removeBottle(st, id) { return st.removed.includes(id) ? st : { ...st, removed: [...st.removed, id] }; }
export function restoreBottle(st, id) { return { ...st, removed: st.removed.filter(x => x !== id) }; }

// ---------- adding bottles ----------
export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
export const splitList = s => String(s || '').split(',').map(t => t.trim()).filter(Boolean);

/** Build a user-added bottle. `ids` = Set of ids already in use (slug gets -2, -3… if taken). */
export function makeBottle(f, ids = new Set()) {
  const name = String(f.name || '').trim(), house = String(f.house || '').trim();
  if (!name || !house) throw new Error('Name and house are required');
  const base = slugify(`${house} ${name}`) || 'bottle';
  let id = base;
  for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
  const notes = splitList(f.notes);
  const manual = { seasons: f.seasons || [], occasions: f.occasions || [], source: 'Your own tags (added in the app).' };
  if (f.strength) manual.strength = f.strength;
  if (f.longevity) manual.longevity = f.longevity;
  if (f.rating != null && f.rating !== '') manual.rating = Math.max(1, Math.min(10, Number(f.rating)));
  return {
    id, name, house, userName: `${house} ${name}`, year: null, concentration: (f.concentration || '').trim() || null,
    genderLabel: null, notes: notes.length ? { flat: notes } : null, accords: null, scentSummary: '',
    parfumoUrl: (f.url || '').trim() || null, flags: [], manual, profile: {}, notesOnFit: null, userAdded: true,
  };
}

// ---------- export / import ----------
export function exportChanges(st, now = new Date()) {
  return { app: 'scentpick', format: 1, exported: now.toISOString(),
    added: clone(st.added), removed: clone(st.removed), edits: clone(st.edits), corrections: clone(st.corrections) };
}
/** Replace the user's changes with an exported blob (weather cache and prefs are kept). Throws on bad input. */
export function importChanges(st, data) {
  const obj = typeof data === 'string' ? JSON.parse(data) : data;
  if (!isObj(obj) || !['added', 'removed', 'edits', 'corrections'].some(k => k in obj)) {
    throw new Error("That doesn't look like a Scent Pick export");
  }
  const n = normalize(obj);
  return { ...st, added: n.added, removed: n.removed, edits: n.edits, corrections: n.corrections };
}
