// Scent Pick — UI. Hash-routed views rendered as HTML strings, one delegated click handler, all state in `S`.
// Ranking lives in engine.js (the contract), persistence in store.js, forecast handling in weather.js.
import { OCCASIONS, occasionById, WHEN_PRESETS, inferWindow, windowForPreset, rank, contextLine } from './engine.js';
import * as store from './store.js';
import { LOCATION, fetchForecast, isStale, ageText, weatherForWindow, cleanOverride } from './weather.js';

const view = document.getElementById('view');
const sheet = document.getElementById('sheet');
const $ = (sel, root = document) => root.querySelector(sel);
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const fmtN = n => Number(n || 0).toLocaleString('en-AU');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
const hasCommunity = b => !!(b?.community?.ratings?.scent && b.community.charts?.occasion);

/** All app state. Exposed as window.__scentpick.state for automated testing. */
const S = {
  base: null, loadError: null, collection: { bottles: [] }, st: store.loadState(),
  route: { name: 'pick' }, routeKey: '', lastTab: 'pick', lastOcc: null, forward: false, depth: 0, scroll: new Map(),
  pickPreset: null, restOpen: false, search: '', lastRanked: [], exportText: '',
  weatherBusy: false, weatherError: null, update: null, version: null, reg: null, debug: debugFlag(),
};

function debugFlag() {
  if (/[?&]debug\b/.test(location.search)) return true;
  try { return sessionStorage.getItem('scentpick.debug') === '1'; } catch { return false; }
}
function remerge() { S.collection = store.mergeCollection(S.base, S.st); }
/** Replace persisted state, save it, rebuild the merged collection. */
function commit(next) { S.st = next; store.saveState(S.st); remerge(); }
const bottle = id => S.collection.bottles.find(b => b.id === id);
const wx = win => weatherForWindow(S.st.weatherCache, win, S.st.prefs.weatherOverride);

// ---------- routing ----------
function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  let parts;
  try { parts = path.split('/').filter(Boolean).map(decodeURIComponent); } catch { parts = []; }
  const [name, arg] = parts, q = new URLSearchParams(qs);
  if ((name === 'results' || name === 'bottle') && arg) return { name, q, [name === 'results' ? 'occ' : 'id']: arg };
  if (name === 'collection' || name === 'settings') return { name, q };
  return { name: 'pick', q };
}

const VIEWS = { pick: viewPick, results: viewResults, bottle: viewBottle, collection: viewCollection, settings: viewSettings };
function render({ enter = false } = {}) {
  const r = S.route = parseRoute();
  S.routeKey = location.hash || '#/';
  if (r.name === 'results' && r.occ !== S.lastOcc) { S.restOpen = false; S.lastOcc = r.occ; }
  view.innerHTML = VIEWS[r.name](r);
  const tab = r.name === 'results' ? 'pick' : r.name === 'bottle' ? S.lastTab : r.name;
  S.lastTab = tab;
  document.querySelectorAll('.tabbar a').forEach(a => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (r.name === 'collection') filterList();
  if (enter && !reducedMotion()) { view.classList.remove('enter'); void view.offsetWidth; view.classList.add('enter'); }
}

/** Re-render keeping focus on the equivalent control (stepper, thumb…) for keyboard/VoiceOver users. */
function rerender() {
  const a = document.activeElement;
  let sel = null;
  if (a && view.contains(a) && a.dataset.act) {
    sel = `[data-act="${a.dataset.act}"]` + ['id', 'occ', 'd', 'dir', 'v']
      .map(k => (a.dataset[k] != null ? `[data-${k}="${CSS.escape(a.dataset[k])}"]` : '')).join('');
  }
  render();
  if (sel) $(sel, view)?.focus({ preventScroll: true });
}

/** Animate cards from their old to new positions after a re-rank (FLIP). */
function flip(fn) {
  const before = new Map();
  view.querySelectorAll('[data-flip]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height) before.set(el.dataset.flip, r.top);
  });
  fn();
  if (reducedMotion() || !Element.prototype.animate) return;
  view.querySelectorAll('[data-flip]').forEach(el => {
    const r = el.getBoundingClientRect(), t0 = before.get(el.dataset.flip);
    if (!r.height || t0 == null || Math.abs(t0 - r.top) < 2) return;
    el.animate([{ transform: `translateY(${t0 - r.top}px)` }, { transform: 'none' }],
      { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
}

function goBack(to) {
  if (S.depth > 0) history.back();
  else location.replace(to || '#/');
}

// ---------- shared bits ----------
const BACK_SVG = '<svg viewBox="0 0 13 22" aria-hidden="true"><path d="M11 2 2 11l9 9"/></svg>';
function appbar({ title = '', back = null, backLabel = 'Back', end = '' } = {}) {
  const left = back
    ? `<button type="button" class="back" data-act="back" data-to="${esc(back)}">${BACK_SVG}<span>${esc(backLabel)}</span></button>`
    : '<span class="brand">Scent Pick</span>';
  const t = title ? `<h1 class="title">${esc(title)}</h1>` : '<span class="spacer"></span>';
  return `<header class="appbar">${left}${t}<div class="end">${end}</div></header>`;
}
const page = html => `<div class="page">${html}</div>`;
const chip = (label, on, act, v, extra = '') =>
  `<button type="button" class="chip" data-act="${act}" data-v="${esc(v)}" aria-pressed="${on}"${extra}>${esc(label)}</button>`;
const loadingOrError = () => S.loadError
  ? `<div class="group" style="margin-top:14px"><p>Couldn't load your collection (${esc(S.loadError)}).</p><div class="btn-row"><button type="button" class="btn primary" data-act="retry-load">Try again</button></div></div>`
  : '<div class="skeleton" aria-label="Loading"></div>';

function strip(text, w) {
  const c = S.st.weatherCache;
  const age = c && isStale(c) ? `forecast from ${ageText(c.fetchedAt)}` : (!c && S.weatherBusy ? 'loading forecast…' : '');
  return `<p class="strip"><span class="wx">${esc(text)}</span>`
    + (w?.overridden ? '<span class="pill debug">DEBUG WEATHER</span>' : '')
    + (age ? `<span class="age">${esc(age)}</span>` : '')
    + (w?.note ? `<span class="note">${esc(w.note)}</span>` : '') + '</p>';
}
const rangeText = ([a, b]) => (a === b ? `~${a} h` : `~${a}–${b} h`);
const perfWord = (avg, kind) => avg == null ? '' : avg >= 8.3 ? (kind === 'l' ? 'very long' : 'strong')
  : avg >= 7.6 ? (kind === 'l' ? 'long' : 'good') : avg >= 7 ? 'moderate' : (kind === 'l' ? 'short' : 'soft');

// ---------- Pick (home) ----------
function greeting(h = new Date().getHours()) {
  return h < 5 ? 'Late one, James' : h < 12 ? 'Morning, James' : h < 17 ? 'Afternoon, James' : 'Evening, James';
}
function viewPick() {
  const p = S.pickPreset;
  const win = windowForPreset(p || 'now', 'casual');
  const w = wx(win);
  const when = chip('Auto', !p, 'when', '') + WHEN_PRESETS.map(x => chip(x.label, p === x.id, 'when', x.id)).join('');
  return appbar() + page(`
    <p class="eyebrow" style="margin-top:14px">${esc(greeting())}</p>
    <h1 class="big" style="margin-top:4px">What's the occasion?</h1>
    ${strip(contextLine('casual', w, win), w)}
    <div class="chips" role="group" aria-label="When">${when}</div>
    <nav class="grid" aria-label="Occasions">${OCCASIONS.map(o => tile(o, p)).join('')}</nav>`);
}
function tile(o, preset) {
  const win = preset ? windowForPreset(preset, o.id) : inferWindow(o.id);
  const w = wx(win);
  const temp = w?.tempMean != null ? ` · ${Math.round(w.tempMean)}°` : '';
  const href = `#/results/${o.id}${preset ? `?when=${preset}` : ''}`;
  return `<a class="tile" href="${href}"><span class="tile-icon" aria-hidden="true">${o.icon}</span>`
    + `<span class="tile-label">${esc(o.label)}</span>${o.sub ? `<span class="tile-sub">${esc(o.sub)}</span>` : ''}`
    + `<span class="tile-when">${esc(win.label)}${temp}</span></a>`;
}

// ---------- Results ----------
function viewResults(r) {
  const occ = occasionById(r.occ);
  if (!occ) return appbar({ back: '#/', backLabel: 'Pick' }) + page('<p class="empty">Unknown occasion.</p>');
  const preset = WHEN_PRESETS.some(p => p.id === r.q.get('when')) ? r.q.get('when') : null;
  const variant = occ.variants?.find(v => v.id === r.q.get('v'))?.id || null;
  const win = preset ? windowForPreset(preset, occ.id) : inferWindow(occ.id);
  const w = wx(win);
  const variants = occ.variants
    ? `<div class="chips sm" role="group" aria-label="Who with"><span class="lbl">With</span>${occ.variants.map(v => chip(v.label, variant === v.id, 'variant', v.id)).join('')}</div>` : '';
  const when = `<div class="chips sm" role="group" aria-label="When">${WHEN_PRESETS.map(p => chip(p.label, win.preset === p.id, 'rwhen', p.id)).join('')}</div>`;
  let body = loadingOrError();
  if (S.base) {
    const ranked = S.lastRanked = rank({ collection: S.collection, occasionId: occ.id, variant, window: win, weather: w, corrections: S.st.corrections });
    body = ranked.length ? cardList(ranked, occ)
      : '<p class="empty">Nothing to rank — every bottle is hidden or removed. <a href="#/collection">Open Collection</a></p>';
  }
  return appbar({ back: '#/', backLabel: 'Pick', title: `${occ.icon} ${occ.label}` })
    + page(`${variants}${when}<div style="margin-top:10px">${strip(contextLine(occ.id, w, win), w)}</div>${body}`);
}
function cardList(list, occ) {
  const top = list.slice(0, 4), rest = list.slice(4);
  const hidden = S.collection.bottles.filter(b => !b.removed && S.st.corrections[b.id]?.hidden).length;
  return `<div class="cards">${top.map((x, i) => card(x, occ, i)).join('')}</div>`
    + (rest.length ? `<details class="rest"${S.restOpen ? ' open' : ''}><summary>Show the rest (${rest.length})</summary>`
      + `<div class="cards">${rest.map((x, i) => card(x, occ, i + 4)).join('')}</div></details>` : '')
    + (hidden ? `<p class="footnote">${hidden} hidden from picks · <a href="#/collection">manage in Collection</a></p>` : '');
}
function card(x, occ, i) {
  const b = x.bottle, hero = i === 0, sp = x.sprays, lo = x.longevity;
  const fav = store.getStep(S.st.corrections, b.id, 'global') > 0 ? '<span class="fav" title="Favourite">★ </span>' : '';
  const badge = `<span class="badge ${x.grade.toLowerCase()}">${x.grade}</span>`;
  const why = sp.why ? ` (${esc(sp.why)})` : '';
  const need = Math.round(lo.needed);
  const main = hero ? `
      <div class="card-top"><span class="eyebrow">Top pick</span>${badge}</div>
      <h2 class="name">${fav}${esc(b.name)}</h2><p class="house">${esc(b.house)}</p>
      <p class="reason">${esc(x.reason)}</p>
      <div class="stats">
        <div class="stat"><b>${sp.n}</b><span class="k">sprays</span>${sp.why ? `<span class="v">(${esc(sp.why)})</span>` : ''}</div>
        <div class="stat"><b>${rangeText(lo.range)}</b><span class="k">longevity</span><span class="v">${lo.enough
          ? `<span class="ok">✓ covers ~${need} h</span>` : `<span class="warn">⚠ may fade before ~${need} h</span>`}</span></div>
      </div>
      <p class="where">Where: <b>${esc(sp.where)}</b></p>`
    : `
      <div class="card-top"><span class="rank">${i + 1}</span><div class="ttl"><h3 class="name">${fav}${esc(b.name)}</h3><p class="house">${esc(b.house)}</p></div>${badge}</div>
      <p class="reason">${esc(x.reason)}</p>
      <p class="meta"><span>💨 <b>${sp.n} sprays</b>${why} · ${esc(sp.where)}</span>
        <span>⏱ <b>${rangeText(lo.range)}</b> ${lo.enough ? '<span class="ok">✓</span>' : `<span class="warn">⚠ may fade before ~${need} h</span>`}</span></p>`;
  return `<article class="card${hero ? ' hero' : ''}" data-flip="${esc(b.id)}">
    <a class="card-main" href="#/bottle/${encodeURIComponent(b.id)}">${main}</a>
    <div class="card-foot">${dataTags(x)}${thumbs(b, occ)}</div></article>`;
}
function dataTags(x) {
  const t = x.thin.map(k => `<span class="tag thin">thin data: ${esc(k)}</span>`);
  if (x.manual) t.push('<span class="tag">your tags</span>');
  if (x.noData) t.push('<span class="tag thin">no data</span>');
  if (x.sky?.penalty >= 7) t.push('<span class="tag thin">wants sun</span>');
  if (x.sky?.bonus >= 2) t.push('<span class="tag">suits grey days</span>');
  return `<div class="tags">${t.join('')}</div>`;
}
function thumbs(b, occ) {
  const v = store.getStep(S.st.corrections, b.id, occ.id), occL = occ.label.toLowerCase();
  const state = v > 0 ? `boosted${v > 1 ? ' ×2' : ''}` : v < 0 ? `marked down${v < -1 ? ' ×2' : ''}` : '';
  const btn = (dir, emoji, label) => `<button type="button" class="thumb" data-act="thumb" data-id="${esc(b.id)}" data-dir="${dir}" aria-pressed="${dir > 0 ? v > 0 : v < 0}" aria-label="${label} ${esc(b.name)} for ${esc(occL)}">${emoji}</button>`;
  return `<div class="thumbs">${state ? `<span class="state ${v > 0 ? 'up' : 'down'}">${state}</span>` : ''}${btn(1, '👍', 'Boost')}${btn(-1, '👎', 'Mark down')}</div>`;
}
function onThumb(id, dir) {
  const occ = occasionById(S.route.occ), b = bottle(id);
  if (!occ || !b) return;
  commit({ ...S.st, corrections: store.thumb(S.st.corrections, id, occ.id, dir) });
  flip(rerender);
  const pos = S.lastRanked.findIndex(x => x.bottle.id === id) + 1;
  const v = store.getStep(S.st.corrections, id, occ.id);
  toast(`${b.name} ${v > 0 ? 'boosted' : v < 0 ? 'marked down' : 'back to neutral'} for ${occ.label.toLowerCase()} — now #${pos}`);
  $(`[data-flip="${CSS.escape(id)}"]`, view)?.classList.add('bump');
}
function setResultsParam(key, val, toggle) {
  const q = new URLSearchParams(S.route.q);
  if (toggle && q.get(key) === val) q.delete(key); else q.set(key, val);
  const qs = q.toString();
  history.replaceState(history.state, '', `#/results/${encodeURIComponent(S.route.occ)}${qs ? `?${qs}` : ''}`);
  flip(render);
}

// ---------- Bottle detail ----------
const OCC_CATS = ['Business', 'Daily', 'Leisure', 'Sport', 'Evening', 'Night Out'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const CAT_NAME = { Fall: 'Autumn', 'Night Out': 'Night out' };
const ACCORD_W = { l: 1, m: 0.64, s: 0.36 };
const bar = (label, frac, val) => `<div class="bar"><span class="bl">${esc(label)}</span><span class="bt"><i style="width:${Math.round(frac * 100)}%"></i></span><span class="bv">${esc(val)}</span></div>`;
function chart(title, ch, cats) {
  if (!ch?.pct) return '';
  const rows = cats.map(k => [k, ch.pct[k] || 0]);
  const max = Math.max(1, ...rows.map(r => r[1]));
  return `<div class="chart"><h4>${title}</h4><div class="bars">${rows.map(([k, v]) => bar(CAT_NAME[k] || k, v / max, `${v}%`)).join('')}</div>`
    + `<p class="votes">${fmtN(ch.votes)} votes${ch.votes < 30 ? ' · thin data' : ''}</p></div>`;
}
function audienceLine(a) {
  if (!a?.pct) return '';
  const p = a.pct;
  const g = (p.Masculine || 0) >= (p.Feminine || 0) ? ['masculine', p.Masculine] : ['feminine', p.Feminine];
  const s = (p.Modern || 0) >= (p.Classic || 0) ? ['modern', p.Modern] : ['classic', p.Classic];
  return `<p class="small" style="margin-top:14px">Audience &amp; style: ${g[1] ?? 0}% ${g[0]} · ${s[1] ?? 0}% ${s[0]} · ${fmtN(a.votes)} votes</p>`;
}
function notesBlock(n) {
  if (!n) return '';
  const pills = list => (list || []).map(x => `<span class="note-pill">${esc(x)}</span>`).join('');
  const rows = n.flat ? [['Notes', n.flat]] : [['Top', n.top], ['Heart', n.heart], ['Base', n.base]].filter(r => r[1]?.length);
  if (!rows.length) return '';
  return `<div class="group"><h3>Notes</h3><dl class="pyr" style="margin:0">${rows.map(([k, l]) => `<dt>${k}</dt><dd>${pills(l)}</dd>`).join('')}</dl></div>`;
}
function perfBlock(b) {
  const R = b.community?.ratings;
  const stat = (k, avg, word, votes) => `<div class="stat"><b>${avg ?? '—'}</b><span class="k">${k}</span><span class="v">${esc(word)}${votes != null ? `<br>${fmtN(votes)} votes` : ''}</span></div>`;
  if (R?.scent) {
    return `<div class="group"><h3>Performance</h3><div class="perf">
      ${stat('Scent', R.scent.avg, 'rating /10', R.scent.votes)}
      ${stat('Longevity', R.longevity?.avg, perfWord(R.longevity?.avg, 'l'), R.longevity?.votes)}
      ${stat('Sillage', R.sillage?.avg, perfWord(R.sillage?.avg, 's'), R.sillage?.votes)}</div></div>`;
  }
  return '';
}
function manualBlock(b) {
  const m = b.manual;
  if (!m) return '';
  const occs = (m.occasions || []).map(id => occasionById(id)?.label || id).join(', ') || '—';
  const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${esc(v || '—')}</span></div>`;
  return `<div class="group"><h3>Your tags</h3>
    ${kv('Seasons', (m.seasons || []).join(', '))}${kv('Occasions', occs)}${kv('Strength', m.strength)}${kv('Longevity', m.longevity)}
    ${kv('Your rating', m.rating != null ? `${m.rating}/10` : '')}
    <p class="small" style="margin-top:8px">${esc(m.source || '')}${hasCommunity(b) ? ' Not used while community data exists.' : ''}</p>
    <div class="btn-row"><button type="button" class="btn" data-act="edit">Edit tags</button></div></div>`;
}
function adjustBlock(b) {
  const c = S.st.corrections[b.id] || {};
  const rows = OCCASIONS.map(o => {
    const v = c[o.id] || 0;
    return `<div class="adj"><span>${o.icon} ${esc(o.label)}</span><div class="stepper">
      <button type="button" data-act="step" data-occ="${o.id}" data-d="-1" aria-label="Lower for ${esc(o.label)}"${v <= store.STEP_MIN ? ' disabled' : ''}>−</button>
      <output class="${v > 0 ? 'up' : v < 0 ? 'down' : ''}" aria-label="${esc(o.label)} adjustment">${v > 0 ? '+' : ''}${v}</output>
      <button type="button" data-act="step" data-occ="${o.id}" data-d="1" aria-label="Raise for ${esc(o.label)}"${v >= store.STEP_MAX ? ' disabled' : ''}>+</button></div></div>`;
  }).join('');
  return `<div class="group"><h3>Your adjustments</h3><p class="small" style="margin-bottom:6px">Each step moves this bottle about 6 points for that occasion (−2 to +2). ★ Favourite adds a step everywhere.</p>${rows}</div>`;
}
function sourceBlock(b) {
  const comm = b.community, R = comm?.ratings;
  let src;
  if (R?.scent) {
    const label = `Parfumo community · ${fmtN(R.scent.votes)} ratings · retrieved ${comm.retrieved || '?'}`;
    src = comm.url ? `<a href="${esc(comm.url)}" target="_blank" rel="noopener">${esc(label)}</a>` : esc(label);
  } else if (b.parfumoUrl) {
    src = `No community data in the app · <a href="${esc(b.parfumoUrl)}" target="_blank" rel="noopener">Parfumo page</a>`;
  } else src = 'No community data for this bottle — ranked from your tags or neutral defaults.';
  const flags = (b.flags || []).length
    ? `<h3 style="margin-top:14px">Data notes</h3><ul class="flags">${b.flags.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : '';
  return `<div class="group"><h3>Source</h3><p class="src">${src}</p>${flags}</div>`;
}
function viewBottle({ id }) {
  const head = appbar({ back: '#/collection', end: S.base && bottle(id) ? '<button type="button" class="iconbtn" data-act="edit">Edit</button>' : '' });
  if (!S.base) return head + page(loadingOrError());
  const b = bottle(id);
  if (!b) return head + page('<p class="empty">That bottle isn\'t in your collection.</p>');
  const c = S.st.corrections[b.id] || {}, C = b.community?.charts || {};
  const meta = [b.year, b.concentration, b.genderLabel].filter(Boolean).map(esc).join(' · ');
  const accords = (b.accords || []).length
    ? `<div class="group"><h3>Accords</h3><div class="bars">${b.accords.map(a => bar(a.accord, ACCORD_W[a.size] || 0.3, '')).join('')}</div></div>` : '';
  const suits = C.occasion || C.season
    ? `<div class="group"><h3>Suits</h3>${chart('Occasion', C.occasion, OCC_CATS)}${chart('Season', C.season, SEASONS)}${audienceLine(C.audience_style)}</div>` : '';
  return head + page(`
    <div class="detail-head"><h2 class="name">${esc(b.name)}</h2><p class="house">${esc(b.house)}</p>
      ${meta ? `<p class="meta-line">${meta}</p>` : ''}${b.aka ? `<p class="meta-line">Also known as ${esc(b.aka)}</p>` : ''}</div>
    ${b.removed ? `<div class="callout danger"><span>Removed from your collection.</span><button type="button" class="btn" data-act="restore" data-id="${esc(b.id)}">Restore</button></div>` : ''}
    <div class="actions">
      <button type="button" class="btn" data-act="fav" aria-pressed="${(c.global || 0) > 0}">★ Favourite</button>
      <button type="button" class="btn" data-act="hide" aria-pressed="${!!c.hidden}">🚫 Hide from picks</button>
    </div>
    <div class="group">${b.scentSummary ? `<p>${esc(b.scentSummary)}</p>` : '<p class="muted">No description yet.</p>'}
      ${b.notesOnFit ? `<p class="callout">${esc(b.notesOnFit)}</p>` : ''}</div>
    ${notesBlock(b.notes)}${accords}${perfBlock(b)}${suits}${manualBlock(b)}${adjustBlock(b)}${sourceBlock(b)}
    <div class="btn-row" style="margin-top:18px">${b.removed
      ? `<button type="button" class="btn wide" data-act="restore" data-id="${esc(b.id)}">Restore bottle</button>`
      : '<button type="button" class="btn danger wide" data-act="remove">Remove bottle</button>'}</div>`);
}

// ---------- Collection ----------
function viewCollection() {
  const head = appbar();
  if (!S.base) return head + page('<h1 class="big">Collection</h1>' + loadingOrError());
  const bs = [...S.collection.bottles].sort((a, b) => (!!a.removed - !!b.removed) || a.name.localeCompare(b.name));
  const nRemoved = bs.filter(b => b.removed).length;
  const nHidden = bs.filter(b => !b.removed && S.st.corrections[b.id]?.hidden).length;
  const summary = [`${bs.length - nRemoved} bottles`, nHidden && `${nHidden} hidden`, nRemoved && `${nRemoved} removed`].filter(Boolean).join(' · ');
  return head + page(`<h1 class="big">Collection</h1><p class="muted">${summary}</p>
    <div class="search"><input type="search" data-search value="${esc(S.search)}" placeholder="Search name, house or note" aria-label="Search bottles" autocomplete="off" enterkeyhint="search"></div>
    <button type="button" class="btn primary wide" data-act="add">＋ Add bottle</button>
    <ul class="list" style="margin-top:12px">${bs.map(collectionRow).join('')}</ul>
    <p class="empty" data-noresults hidden>No bottles match.</p>`);
}
function collectionRow(b) {
  const R = b.community?.ratings, corr = S.st.corrections[b.id] || {};
  const lw = R?.longevity?.avg != null ? perfWord(R.longevity.avg, 'l') : b.manual?.longevity;
  const sw = R?.sillage?.avg != null ? perfWord(R.sillage.avg, 's') : b.manual?.strength;
  const notes = b.notes ? (b.notes.flat || [...(b.notes.top || []), ...(b.notes.heart || []), ...(b.notes.base || [])]) : [];
  const minis = [
    lw && `<span class="mini">⏱ ${esc(lw)}</span>`, sw && `<span class="mini">💨 ${esc(sw)}</span>`,
    corr.global > 0 && '<span class="mini hl">★ favourite</span>', !hasCommunity(b) && b.manual && '<span class="mini">your tags</span>',
    b.userAdded && '<span class="mini">added by you</span>', corr.hidden && '<span class="mini bad">hidden</span>',
    b.removed && '<span class="mini bad">removed</span>',
  ].filter(Boolean).join('');
  const sum = b.scentSummary || notes.join(', ');
  const q = [b.name, b.house, b.userName, b.aka, notes.join(' '), (b.accords || []).map(a => a.accord).join(' ')].join(' ').toLowerCase();
  return `<li data-q="${esc(q)}"><a class="row${b.removed ? ' is-removed' : ''}" href="#/bottle/${encodeURIComponent(b.id)}">
    <div class="row-main"><div><span class="nm">${esc(b.name)}</span> <span class="hs">· ${esc(b.house)}</span></div>
    ${sum ? `<p class="sum">${esc(sum)}</p>` : ''}<div class="minis">${minis}</div></div><span class="chev" aria-hidden="true">›</span></a></li>`;
}
function filterList() {
  const terms = S.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;
  view.querySelectorAll('.list li').forEach(li => {
    const ok = terms.every(t => li.dataset.q.includes(t));
    li.hidden = !ok; shown += ok;
  });
  const list = $('.list', view), none = $('[data-noresults]', view);
  if (list) list.hidden = !shown;
  if (none) none.hidden = shown > 0;
}

// ---------- Settings ----------
function viewSettings() {
  const c = S.st.weatherCache;
  const wxStatus = (S.weatherBusy ? 'Updating…' : c ? `Updated ${ageText(c.fetchedAt)}` : 'No forecast yet')
    + (S.weatherError ? ` · last try failed (${S.weatherError})` : '') + (navigator.onLine === false ? ' · offline' : '');
  const removed = S.collection.bottles.filter(b => b.removed);
  const nCorr = Object.keys(S.st.corrections).length;
  const changes = [`${S.st.added.length} added`, `${Object.keys(S.st.edits).length} edited`, `${S.st.removed.length} removed`, `${nCorr} with corrections`].join(' · ');
  const removedRows = removed.length
    ? removed.map(b => `<div class="set-row"><span>${esc(b.name)} <span class="small">· ${esc(b.house)}</span></span><button type="button" class="btn" data-act="restore" data-id="${esc(b.id)}">Restore</button></div>`).join('')
      + (removed.length > 1 ? '<div class="btn-row"><button type="button" class="btn" data-act="restore-all">Restore all</button></div>' : '')
    : '<p class="small">Nothing removed.</p>';
  return appbar() + page(`<h1 class="big">Settings</h1>
    ${S.update ? '<div class="callout" style="display:flex;align-items:center;justify-content:space-between;gap:10px"><b>Update available</b><button type="button" class="btn primary" data-act="reload">Reload</button></div>' : ''}
    <h2 class="section-title">Location &amp; weather</h2>
    <div class="group">
      <div class="set-row"><span>📍 ${esc(LOCATION.name)} (−27.53, 152.98)</span></div>
      <div class="set-row"><span>Forecast<br><span class="small">${esc(wxStatus)}</span></span>
        <button type="button" class="btn" data-act="wx-refresh"${S.weatherBusy ? ' disabled' : ''}>Refresh</button></div>
    </div>
    <h2 class="section-title">Your changes</h2>
    <div class="group"><p class="small">${changes}</p>
      <div class="btn-row"><button type="button" class="btn" data-act="export">Export my changes</button>
        <button type="button" class="btn" data-act="import">Import</button>
        <button type="button" class="btn danger" data-act="reset-corr"${nCorr ? '' : ' disabled'}>Reset corrections</button></div></div>
    <h2 class="section-title">Restore removed</h2>
    <div class="group">${removedRows}</div>
    <h2 class="section-title">About &amp; data</h2>
    <div class="group about">
      <p>Rankings use <b>Parfumo</b> community data: the occasion and season charts and the scent, longevity and sillage ratings for each bottle, always with their vote counts.</p>
      <p>A chart shows the share of voters who picked each occasion or season (people can pick several). The season chart is matched to the forecast for your wear window; indoor occasions blend in a typical indoor temperature.</p>
      <p>Thin data is shrunk toward neutral: a chart counts as if 25 neutral votes were added and a rating as if 40 average ones were, so a handful of votes can't push a bottle to the top or bottom. Cards say "thin data" when that matters.</p>
      <p>No numbers are invented. Bottles without community data are ranked from your own tags ("your tags") or neutral defaults ("no data"). Sprays and longevity are estimates from the sillage and longevity ratings, adjusted for heat, closeness and open air.</p>
      <p>Weather: Open-Meteo hourly forecast for Sherwood. Your 👍/👎, ★ and edits stay on this phone; export them to keep a copy.</p>
    </div>
    <h2 class="section-title">App</h2>
    <div class="group">
      <div class="set-row"><span>Version</span><span class="small">${esc(S.version || '—')}</span></div>
      <div class="set-row"><span>${S.update ? 'Update available — reload' : 'Updates'}</span>
        <button type="button" class="btn${S.update ? ' primary' : ''}" data-act="${S.update ? 'reload' : 'check-update'}">${S.update ? 'Reload' : 'Check now'}</button></div>
    </div>
    ${S.debug ? debugSection() : ''}`);
}
function debugSection() {
  const o = S.st.prefs.weatherOverride || {};
  const f = (k, label, ph) => `<label class="field"><span>${label}</span><input name="${k}" type="number" inputmode="decimal" step="any" value="${esc(o[k] ?? '')}" placeholder="${ph}"></label>`;
  const w = wx(windowForPreset('now', 'casual'));
  const r1 = v => (v == null ? null : Math.round(v * 10) / 10);
  const now = w && { label: w.label, temp: r1(w.tempMean), feels: r1(w.feelsMean), humidity: r1(w.humidity), rain: w.rainProb, cloud: r1(w.cloud), gloom: r1(w.gloom), wind: r1(w.wind), nightShare: r1(w.nightShare), muggy: w.muggy };
  return `<h2 class="section-title">Debug</h2>
    <form class="group" data-form="debug"><p class="small">Weather override — applies to every wear window until cleared.</p>
      <div class="dbg-grid">${f('temp', 'Temperature °C', 'e.g. 33')}${f('humidity', 'Humidity %', 'e.g. 75')}${f('rain', 'Rain %', 'e.g. 60')}${f('cloud', 'Cloud cover %', 'e.g. 90')}${f('wind', 'Wind km/h', 'e.g. 30')}${f('nightShare', 'Night share 0–1', 'e.g. 1')}</div>
      <div class="btn-row"><button class="btn primary">Apply override</button><button type="button" class="btn" data-act="dbg-clear">Clear override</button></div>
      <pre class="code">${esc(JSON.stringify({ override: S.st.prefs.weatherOverride || null, now }, null, 1))}</pre></form>`;
}
function setOverride(o) {
  const clean = o ? cleanOverride(o) : null;
  commit({ ...S.st, prefs: { ...S.st.prefs, weatherOverride: clean } });
  flip(render);
  return clean;
}

// ---------- sheets, toasts ----------
function openSheet(html, onSubmit) {
  sheet.innerHTML = `<form method="dialog" class="sheet-inner" novalidate>${html}</form>`;
  const form = sheet.firstElementChild;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = e.submitter?.value ?? 'ok';
    if (onSubmit && onSubmit(form, v) === false) return;
    closeSheet(v);
  });
  sheet.returnValue = '';
  if (typeof sheet.showModal === 'function') { if (!sheet.open) sheet.showModal(); } else sheet.setAttribute('open', '');
  return form;
}
function closeSheet(value = '') {
  if (!sheet.open) return;
  if (typeof sheet.close === 'function') sheet.close(value);
  else { sheet.returnValue = value; sheet.removeAttribute('open'); sheet.dispatchEvent(new Event('close')); }
}
/** Resolves true from the submit handler itself (no reliance on the async `close` event); cancel/backdrop/Esc → false. */
function confirmSheet(title, body, okLabel, danger) {
  return new Promise(resolve => {
    openSheet(`<h2 tabindex="-1" autofocus>${esc(title)}</h2>${body ? `<p class="hint">${esc(body)}</p>` : ''}
      <div class="sheet-actions"><button type="button" class="btn" data-act="sheet-close">Cancel</button>
      <button class="btn ${danger ? 'danger solid' : 'primary'}" value="ok">${esc(okLabel)}</button></div>`,
    () => resolve(true));
    sheet.addEventListener('close', () => resolve(false), { once: true });
  });
}
function formError(form, msg) {
  const el = $('.form-err', form);
  el.textContent = msg; el.hidden = false;
  return false;
}
let toastTimer = 0;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.hidden = true; action.run(); };
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, action ? 6000 : 3200);
}

// ---------- add / edit forms ----------
const SEASON_TAGS = [['hot', 'Hot'], ['warm', 'Warm'], ['mild', 'Mild'], ['cool', 'Cool']];
const STRENGTH_TAGS = [['light', 'Light'], ['moderate', 'Moderate'], ['strong', 'Strong']];
const LONGEVITY_TAGS = [['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']];
function field(name, label, value, ph = '', attrs = '') {
  return `<label class="field"><span>${esc(label)}</span><input name="${name}" ${attrs} value="${esc(value ?? '')}" placeholder="${esc(ph)}" autocomplete="off"></label>`;
}
function tagGroup(group, legend, options, selected = [], single = false) {
  return `<fieldset><legend>${legend}</legend><div class="chips wrap sm" data-group="${group}"${single ? ' data-single' : ''}>`
    + options.map(([v, l]) => chip(l, selected.includes(v), 'tag', v)).join('') + '</div></fieldset>';
}
function bottleForm(b) {
  const isNew = !b, m = b?.manual || {}, n = b?.notes;
  const pyramid = n && !n.flat && (n.top || n.heart || n.base);
  const notes = pyramid
    ? ['top', 'heart', 'base'].map(k => field(k, `${cap(k)} notes`, (n[k] || []).join(', '), 'comma separated')).join('')
    : field('notes', 'Notes', (n?.flat || []).join(', '), 'comma separated, e.g. bergamot, vetiver');
  const tags = isNew || !hasCommunity(b)
    ? tagGroup('seasons', 'Weather it suits', SEASON_TAGS, m.seasons) + tagGroup('occasions', 'Occasions', OCCASIONS.map(o => [o.id, o.label]), m.occasions)
      + tagGroup('strength', 'Strength', STRENGTH_TAGS, [m.strength], true) + tagGroup('longevity', 'Longevity', LONGEVITY_TAGS, [m.longevity], true)
      + field('rating', 'Your rating (1–10, optional)', m.rating, 'e.g. 8', 'type="number" inputmode="decimal" min="1" max="10" step="0.5"')
    : '<p class="hint">Ranked from Parfumo community data, so this bottle doesn\'t need your own tags.</p>';
  return `<h2 tabindex="-1" autofocus>${isNew ? 'Add a bottle' : `Edit ${esc(b.name)}`}</h2>
    ${field('name', 'Name *', b?.name, '', 'autocapitalize="words"')}${field('house', 'House *', b?.house, '', 'autocapitalize="words"')}
    ${field('concentration', 'Concentration', b?.concentration, 'e.g. Eau de Parfum')}${notes}
    ${isNew ? field('url', 'Parfumo URL (optional)', '', 'https://www.parfumo.com/…', 'type="url" inputmode="url" autocapitalize="off"') : ''}
    ${tags}<p class="form-err" role="alert" hidden></p>
    <div class="sheet-actions"><button type="button" class="btn" data-act="sheet-close">Cancel</button>
    <button class="btn primary" value="save">${isNew ? 'Add bottle' : 'Save'}</button></div>`;
}
function readForm(form) {
  const v = n => ($(`[name="${n}"]`, form)?.value || '').trim();
  const tags = g => [...form.querySelectorAll(`[data-group="${g}"] [aria-pressed="true"]`)].map(x => x.dataset.v);
  return {
    name: v('name'), house: v('house'), concentration: v('concentration'), url: v('url'), notes: v('notes'),
    top: v('top'), heart: v('heart'), base: v('base'), rating: v('rating'), pyramid: !!$('[name="top"]', form),
    hasTags: !!$('[data-group]', form), seasons: tags('seasons'), occasions: tags('occasions'),
    strength: tags('strength')[0] || '', longevity: tags('longevity')[0] || '',
  };
}
function validate(form, f) {
  if (!f.name || !f.house) return formError(form, 'Name and house are required.');
  if (f.rating && !(+f.rating >= 1 && +f.rating <= 10)) return formError(form, 'Rating must be between 1 and 10.');
  return true;
}
function addSheet() {
  openSheet(bottleForm(null), form => {
    const f = readForm(form);
    if (!validate(form, f)) return false;
    const b = store.makeBottle(f, new Set(S.collection.bottles.map(x => x.id)));
    commit({ ...S.st, added: [...S.st.added, b] });
    S.forward = true;
    location.hash = `#/bottle/${encodeURIComponent(b.id)}`;
    toast(`Added ${b.name}`);
  });
}
function tagsOf(m) {
  return JSON.stringify([[...(m.seasons || [])].sort(), [...(m.occasions || [])].sort(), m.strength || '', m.longevity || '', m.rating ?? null]);
}
function editSheet() {
  const b = bottle(S.route.id);
  if (!b) return;
  openSheet(bottleForm(b), form => {
    const f = readForm(form);
    if (!validate(form, f)) return false;
    const next = { name: f.name, house: f.house, concentration: f.concentration || null };
    if (f.pyramid) {
      const n = { top: store.splitList(f.top), heart: store.splitList(f.heart), base: store.splitList(f.base) };
      next.notes = n.top.length || n.heart.length || n.base.length ? n : null;
    } else {
      const flat = store.splitList(f.notes);
      next.notes = flat.length ? { flat } : null;
    }
    if (f.hasTags) {
      const m = { seasons: f.seasons, occasions: f.occasions };
      if (f.strength) m.strength = f.strength;
      if (f.longevity) m.longevity = f.longevity;
      if (f.rating) m.rating = +f.rating;
      const old = b.manual || {};
      m.source = old.source && tagsOf(old) === tagsOf(m) ? old.source : `Your own tags (edited ${today()}).`;
      next.manual = m;
    }
    const changed = Object.fromEntries(Object.entries(next).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(b[k] ?? null)));
    if (!Object.keys(changed).length) { toast('No changes'); return; }
    commit(store.editBottle(S.st, b.id, changed));
    render();
    toast('Saved');
  });
}
async function removeFlow() {
  const b = bottle(S.route.id);
  if (!b) return;
  const ok = await confirmSheet(`Remove ${b.name}?`, 'It leaves your picks and collection. You can restore it from Settings.', 'Remove', true);
  if (!ok) return;
  commit(store.removeBottle(S.st, b.id));
  goBack('#/collection');
  toast(`Removed ${b.name}`, { label: 'Undo', run: () => { commit(store.restoreBottle(S.st, b.id)); render(); } });
}
function restore(id) {
  const b = bottle(id);
  commit(store.restoreBottle(S.st, id));
  render();
  toast(`Restored ${b?.name || 'bottle'}`);
}

// ---------- export / import / reset ----------
function exportFlow() {
  const json = S.exportText = JSON.stringify(store.exportChanges(S.st), null, 2);
  const form = openSheet(`<h2 tabindex="-1" autofocus>Export my changes</h2>
    <p class="hint" data-copy>Copy this text and keep it somewhere safe.</p>
    <label class="field"><span>Your changes (JSON)</span><textarea readonly>${esc(json)}</textarea></label>
    <div class="sheet-actions">${navigator.share ? '<button type="button" class="btn" data-act="share">Share…</button>' : ''}<button class="btn primary" value="done">Done</button></div>`);
  // Called synchronously inside the tap (Safari requires a user gesture); the sheet is already open whatever happens.
  navigator.clipboard?.writeText(json).then(() => {
    $('[data-copy]', form).textContent = 'Copied to the clipboard ✓ Paste it into Notes or a message to keep it safe.';
  }, () => { /* clipboard blocked: the text is shown instead */ });
}
function importSheet() {
  openSheet(`<h2 tabindex="-1" autofocus>Import changes</h2>
    <p class="hint">Paste an export from “Export my changes”. It replaces your current added, removed and edited bottles and your corrections.</p>
    <label class="field"><span>Export JSON</span><textarea name="json" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea></label>
    <p class="form-err" role="alert" hidden></p>
    <div class="sheet-actions"><button type="button" class="btn" data-act="sheet-close">Cancel</button><button class="btn primary" value="import">Import</button></div>`,
  form => {
    let next;
    try { next = store.importChanges(S.st, $('[name="json"]', form).value); } catch (err) {
      return formError(form, err instanceof SyntaxError ? "That isn't valid JSON." : err.message);
    }
    const prev = S.st;
    commit(next);
    render();
    toast('Imported your changes', { label: 'Undo', run: () => { commit({ ...S.st, added: prev.added, removed: prev.removed, edits: prev.edits, corrections: prev.corrections }); render(); } });
  });
}
async function resetCorrections() {
  const ok = await confirmSheet('Reset all corrections?', 'Clears every 👍/👎, ★ favourite, per-occasion adjustment and hidden flag. Added, edited and removed bottles stay.', 'Reset', true);
  if (!ok) return;
  const prev = S.st.corrections;
  commit({ ...S.st, corrections: {} });
  render();
  toast('Corrections reset', { label: 'Undo', run: () => { commit({ ...S.st, corrections: prev }); render(); } });
}

// ---------- weather ----------
async function refreshWeather(force = false) {
  if (S.weatherBusy) return;
  if (!force && (!isStale(S.st.weatherCache) || navigator.onLine === false)) return;
  S.weatherBusy = true;
  if (S.route.name === 'settings') render();
  try {
    const fc = await fetchForecast();
    S.st = { ...S.st, weatherCache: fc };
    store.saveState(S.st);
    S.weatherError = null;
    if (force) toast('Forecast updated');
  } catch (err) {
    S.weatherError = err?.name === 'AbortError' ? 'timed out' : (err?.message || 'failed');
    if (force) toast(`Couldn't refresh the forecast (${S.weatherError})`);
  } finally {
    S.weatherBusy = false;
    if (['pick', 'results', 'settings'].includes(S.route.name)) flip(render);
  }
}

// ---------- service worker ----------
function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  sw.addEventListener('message', e => {
    const d = e.data || {};
    if (d.type === 'version') S.version = d.version;
    if (d.type === 'updated') { S.update = d.version || true; S.version = d.version || S.version; $('#update').hidden = false; }
    if (S.route.name === 'settings') render();
  });
  sw.startMessages?.();
  sw.register('./sw.js', { scope: './' }).then(reg => { S.reg = reg; }).catch(err => console.warn('Service worker not registered:', err));
  sw.ready.then(reg => (sw.controller || reg.active)?.postMessage('version'));
}
async function checkUpdate() {
  if (!S.reg) { toast('Offline support is not active in this browser'); return; }
  try {
    await S.reg.update();
    toast(S.reg.installing || S.reg.waiting ? 'Downloading the update…' : 'You have the latest version');
  } catch { toast("Couldn't check for updates (offline?)"); }
}

// ---------- events ----------
const ACTIONS = {
  back: el => goBack(el.dataset.to),
  when: el => { S.pickPreset = el.dataset.v || null; render(); },
  rwhen: el => setResultsParam('when', el.dataset.v),
  variant: el => setResultsParam('v', el.dataset.v, true),
  thumb: el => onThumb(el.dataset.id, +el.dataset.dir),
  fav: () => { commit({ ...S.st, corrections: store.toggleFavourite(S.st.corrections, S.route.id) }); rerender(); },
  hide: () => {
    const on = !S.st.corrections[S.route.id]?.hidden;
    commit({ ...S.st, corrections: store.setHidden(S.st.corrections, S.route.id, on) });
    rerender();
    toast(on ? 'Hidden from picks' : 'Back in your picks');
  },
  step: el => {
    const id = S.route.id, k = el.dataset.occ;
    commit({ ...S.st, corrections: store.setStep(S.st.corrections, id, k, store.getStep(S.st.corrections, id, k) + Number(el.dataset.d)) });
    rerender();
  },
  edit: editSheet,
  remove: removeFlow,
  restore: el => restore(el.dataset.id),
  'restore-all': () => { const n = S.st.removed.length; commit({ ...S.st, removed: [] }); render(); toast(`Restored ${n} bottles`); },
  add: addSheet,
  tag: el => {
    const on = el.getAttribute('aria-pressed') !== 'true', group = el.parentElement;
    if (on && group.hasAttribute('data-single')) group.querySelectorAll('[aria-pressed="true"]').forEach(x => x.setAttribute('aria-pressed', 'false'));
    el.setAttribute('aria-pressed', String(on));
  },
  'sheet-close': () => closeSheet(),
  share: () => navigator.share?.({ title: 'Scent Pick — my changes', text: S.exportText }).catch(() => {}),
  export: exportFlow,
  import: importSheet,
  'reset-corr': resetCorrections,
  'wx-refresh': () => refreshWeather(true),
  'retry-load': () => { S.loadError = null; render(); loadCollection(); },
  reload: () => location.reload(),
  'update-dismiss': () => { $('#update').hidden = true; },
  'check-update': checkUpdate,
  'dbg-clear': () => { setOverride(null); toast('Weather override cleared'); },
};

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (a) {
    const href = a.getAttribute('href');
    if (href === (location.hash || '#/')) { // tapping the current tab scrolls to top, like iOS
      e.preventDefault();
      scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    } else S.forward = true;
    return;
  }
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el, e);
});
document.addEventListener('submit', e => {
  if (!e.target.matches('form[data-form="debug"]')) return;
  e.preventDefault();
  const clean = setOverride(Object.fromEntries(new FormData(e.target)));
  toast(clean ? 'Weather override on' : 'No values entered — override cleared');
});
view.addEventListener('input', e => {
  if (e.target.matches('[data-search]')) { S.search = e.target.value; filterList(); }
});
view.addEventListener('toggle', e => { if (e.target.matches?.('details.rest')) S.restOpen = e.target.open; }, true);
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); }); // tap on the backdrop

window.addEventListener('hashchange', () => {
  S.scroll.set(S.routeKey, scrollY);
  const fwd = S.forward;
  S.forward = false;
  S.depth = fwd ? S.depth + 1 : Math.max(0, S.depth - 1);
  closeSheet();
  render({ enter: true });
  scrollTo(0, fwd ? 0 : S.scroll.get(S.routeKey) || 0);
  view.focus({ preventScroll: true });
});

// Long-press the top bar (≈0.65 s) to toggle the hidden Debug section in Settings.
let pressTimer = 0;
document.addEventListener('pointerdown', e => {
  if (!e.target.closest('.appbar') || e.target.closest('button')) return;
  clearTimeout(pressTimer);
  pressTimer = setTimeout(() => {
    S.debug = !S.debug;
    try { sessionStorage.setItem('scentpick.debug', S.debug ? '1' : '0'); } catch { /* ignore */ }
    toast(S.debug ? 'Debug tools on — see Settings' : 'Debug tools off');
    if (S.route.name === 'settings') render();
  }, 650);
});
for (const ev of ['pointerup', 'pointercancel', 'scroll']) addEventListener(ev, () => clearTimeout(pressTimer), { passive: true });

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  refreshWeather();
  S.reg?.update().catch(() => {});
  if (S.route.name === 'pick' || S.route.name === 'results') render(); // wear windows move with the clock
});
addEventListener('online', () => refreshWeather());

// ---------- boot ----------
async function loadCollection() {
  try {
    const res = await fetch('./data/collection.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    S.base = await res.json();
    S.loadError = null;
  } catch (err) {
    S.loadError = err?.message || 'network error';
  }
  remerge();
  render();
}

window.__scentpick = {
  state: S,
  setWeatherOverride: o => setOverride(o),
  render,
};

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
remerge();
render();
loadCollection();
refreshWeather();
initServiceWorker();
