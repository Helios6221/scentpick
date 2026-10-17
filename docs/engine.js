// Scent Pick — ranking engine. Pure functions, no DOM, no network.
// Inputs: the collection (docs/data/collection.json), an occasion, a wear window, hourly weather, user corrections.
// Output: ranked bottles with score, short reason, sprays and expected longevity.
//
// Evidence used (all from Parfumo community charts/ratings, with vote counts):
//  - occasion chart (Business/Daily/Leisure/Sport/Evening/Night Out) -> occasion fit and time-of-day fit
//  - season chart (Spring/Summer/Fall/Winter)                      -> weather fit, via the effective temperature
//  - type chart (Fresh/Citrus/Sweet/...)                            -> secondary heat/freshness modifier
//  - scent rating + votes                                           -> quality/appeal (Bayesian shrinkage for thin data)
//  - longevity rating -> expected hours; sillage rating -> spray count (strength never lowers the score)

export const OCCASIONS = [
  { id: 'office', duration: 9,     label: 'Office',        icon: '💼', indoor: 0.50, indoorTemp: 22, close: true },
  { id: 'casual', duration: 4,     label: 'Casual',        icon: '👟', indoor: 0.15, indoorTemp: 23 },
  { id: 'beach', duration: 5,      label: 'Beach',         icon: '🏖️', indoor: 0.00, indoorTemp: 23, loud: true },
  { id: 'outdoor', duration: 5,    label: 'Outdoor event', sub: 'BBQs, day parties', icon: '🍖', indoor: 0.05, indoorTemp: 24, loud: true },
  { id: 'bars', duration: 5,       label: 'Bars',          icon: '🍸', indoor: 0.35, indoorTemp: 23, loud: true },
  { id: 'clubbing', duration: 6,   label: 'Clubbing',      icon: '🪩', indoor: 0.50, indoorTemp: 28, loud: true },
  { id: 'houseparty', duration: 6, label: 'House party',   icon: '🎉', indoor: 0.30, indoorTemp: 25 },
  { id: 'dinner', duration: 4,     label: 'Dinner',        icon: '🍽️', indoor: 0.50, indoorTemp: 22, close: true,
    variants: [{ id: 'family', label: 'Family' }, { id: 'friends', label: 'Friends' }, { id: 'work', label: 'Work' }] },
  { id: 'date', duration: 5,       label: 'Date',          sub: 'meant to be sexy', icon: '❤️‍🔥', indoor: 0.40, indoorTemp: 23, close: true },
  { id: 'formal', duration: 6,     label: 'Formal',        icon: '🎩', indoor: 0.50, indoorTemp: 22, close: true },
];
export const occasionById = id => OCCASIONS.find(o => o.id === id);

// How each of James's occasions maps onto Parfumo's occasion-chart categories (weights 0..1).
const OCC_W = {
  office:            { Business: 1.0, Daily: 0.6, Leisure: 0.15, Sport: 0.1, Evening: 0.1, 'Night Out': 0.0 },
  casual:            { Leisure: 1.0, Daily: 0.9, Sport: 0.3, Evening: 0.15, 'Night Out': 0.1, Business: 0.2 },
  beach:             { Sport: 1.0, Leisure: 0.9, Daily: 0.5, Evening: 0.0, 'Night Out': 0.0, Business: 0.0 },
  outdoor:           { Leisure: 1.0, Daily: 0.6, Sport: 0.6, Evening: 0.3, 'Night Out': 0.2, Business: 0.0 },
  bars:              { 'Night Out': 1.0, Evening: 0.8, Leisure: 0.4, Daily: 0.2, Business: 0.1, Sport: 0.0 },
  clubbing:          { 'Night Out': 1.0, Evening: 0.5, Leisure: 0.2, Daily: 0.1, Business: 0.0, Sport: 0.1 },
  houseparty:        { 'Night Out': 0.9, Leisure: 0.8, Evening: 0.7, Daily: 0.3, Business: 0.0, Sport: 0.1 },
  dinner:            { Evening: 1.0, Business: 0.5, 'Night Out': 0.5, Daily: 0.3, Leisure: 0.3, Sport: 0.0 },
  'dinner:family':   { Evening: 1.0, Daily: 0.5, Leisure: 0.4, Business: 0.3, 'Night Out': 0.3, Sport: 0.0 },
  'dinner:friends':  { Evening: 1.0, 'Night Out': 0.7, Leisure: 0.4, Daily: 0.3, Business: 0.1, Sport: 0.0 },
  'dinner:work':     { Evening: 0.9, Business: 1.0, Daily: 0.3, 'Night Out': 0.2, Leisure: 0.1, Sport: 0.0 },
  date:              { Evening: 1.0, 'Night Out': 0.9, Leisure: 0.2, Daily: 0.1, Business: 0.0, Sport: 0.0 },
  formal:            { Business: 1.0, Evening: 0.9, 'Night Out': 0.3, Daily: 0.2, Leisure: 0.05, Sport: 0.0 },
};
const CAT_LABEL = { Business: 'business', Daily: 'everyday', Leisure: 'leisure', Sport: 'sport', Evening: 'evening', 'Night Out': 'night-out' };

// Weights of the five fit components per occasion (sum to 1).
const WEIGHTS = {
  default:    { q: 0.28, o: 0.34, w: 0.20, t: 0.06, l: 0.12 },
  office:     { q: 0.24, o: 0.38, w: 0.15, t: 0.08, l: 0.15 },
  beach:      { q: 0.25, o: 0.32, w: 0.25, t: 0.05, l: 0.13 },
  outdoor:    { q: 0.25, o: 0.32, w: 0.25, t: 0.05, l: 0.13 },
  bars:       { q: 0.28, o: 0.34, w: 0.18, t: 0.08, l: 0.12 },
  clubbing:   { q: 0.28, o: 0.34, w: 0.18, t: 0.08, l: 0.12 },
  date:       { q: 0.32, o: 0.31, w: 0.17, t: 0.08, l: 0.12 },
  formal:     { q: 0.28, o: 0.36, w: 0.16, t: 0.06, l: 0.14 },
};

// Season-chart weights as a function of effective temperature (°C). Interpolated between anchors.
const SEASON_ANCHORS = [
  [12, { Winter: 1.0, Fall: 0.75, Spring: 0.3, Summer: 0.0 }],
  [18, { Winter: 0.7, Fall: 0.9, Spring: 0.6, Summer: 0.1 }],
  [23, { Winter: 0.25, Fall: 0.6, Spring: 0.95, Summer: 0.55 }],
  [28, { Winter: 0.05, Fall: 0.25, Spring: 0.7, Summer: 1.0 }],
  [34, { Winter: 0.0, Fall: 0.05, Spring: 0.35, Summer: 1.0 }],
];
function seasonWeights(T) {
  const a = SEASON_ANCHORS;
  if (T <= a[0][0]) return a[0][1];
  if (T >= a[a.length - 1][0]) return a[a.length - 1][1];
  for (let i = 0; i < a.length - 1; i++) {
    const [t0, w0] = a[i], [t1, w1] = a[i + 1];
    if (T >= t0 && T <= t1) {
      const f = (T - t0) / (t1 - t0), out = {};
      for (const k of Object.keys(w0)) out[k] = w0[k] + (w1[k] - w0[k]) * f;
      return out;
    }
  }
  return a[a.length - 1][1];
}

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const PRIOR_SCENT = 7.8, PRIOR_PERF = 7.6, K_RATING = 40, K_CHART = 25;
const shrink = (avg, votes, prior, k) => (avg == null || !votes) ? prior : (avg * votes + prior * k) / (votes + k);
const shrinkFit = (fit, votes, k = K_CHART, neutral = 0.45) => (fit * (votes || 0) + neutral * k) / ((votes || 0) + k);
const weighted = (pct, w) => {
  let s = 0, mx = 0;
  for (const [cat, wt] of Object.entries(w)) { s += (pct[cat] || 0) * wt; mx = Math.max(mx, wt); }
  return mx ? s / 100 / mx : 0;
};

// ---------- weather ----------
export const WMO = c => c === 0 ? 'clear' : c <= 2 ? 'partly cloudy' : c === 3 ? 'overcast' : c <= 48 ? 'foggy' :
  c <= 57 ? 'drizzle' : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow showers' : 'storms';

/** Summarise hourly forecast over a wear window. hourly = Open-Meteo `hourly` object; times are local ISO strings. */
export function summarizeWeather(hourly, win) {
  if (!hourly || !hourly.time) return null;
  const idx = [];
  const parseT = t => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(t) ? t : t + ':00+10:00');
  hourly.time.forEach((t, i) => { const d = parseT(t); if (d >= win.start && d < win.end) idx.push(i); });
  let note = null;
  if (!idx.length) {
    // window is beyond/before the forecast: use the nearest hours we have
    const target = win.start.getTime();
    let best = 0, bd = Infinity;
    hourly.time.forEach((t, i) => { const d = Math.abs(parseT(t).getTime() - target); if (d < bd) { bd = d; best = i; } });
    for (let i = Math.max(0, best - 2); i < Math.min(hourly.time.length, best + 4); i++) idx.push(i);
    note = 'forecast does not cover that time yet; using the nearest hours';
  }
  const pick = k => idx.map(i => (hourly[k] || [])[i]).filter(v => v != null);
  const nightWin = win.start.getHours() >= 17 || win.start.getHours() < 5;
  const wts = idx.map((_, j) => nightWin && idx.length > 1 ? 1 - 0.5 * j / (idx.length - 1) : 1);   // 1.0 -> 0.5 across a night window
  const mean = a => { if (!a.length) return null; let n = 0, d = 0; a.forEach((v, j) => { const w = wts[j] ?? 1; n += v * w; d += w; }); return n / d; };
  const temps = pick('temperature_2m'), feels = pick('apparent_temperature');
  const codes = pick('weather_code');
  const counts = new Map(); codes.forEach(c => counts.set(c, (counts.get(c) || 0) + 1));
  const code = codes.length ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
  const isDay = pick('is_day');
  const out = {
    tempMean: mean(temps), tempMax: temps.length ? Math.max(...temps) : null, tempMin: temps.length ? Math.min(...temps) : null,
    feelsMean: mean(feels.length ? feels : temps), feelsMax: (feels.length ? Math.max(...feels) : null),
    humidity: mean(pick('relative_humidity_2m')), rainProb: Math.max(0, ...pick('precipitation_probability')),
    wind: mean(pick('wind_speed_10m')), uv: Math.max(0, ...pick('uv_index')), cloud: mean(pick('cloud_cover')),
    nightShare: isDay.length ? isDay.filter(v => !v).length / isDay.length : null, code, desc: code == null ? null : WMO(code), note,
  };
  out.muggy = out.humidity != null && out.humidity >= 72 && out.feelsMean >= 24;
  // gloom: how grey/wet the sky is. Cloud cover if we have it, else infer from the WMO code.
  const cloudPart = out.cloud != null ? clamp((out.cloud - 40) / 50) : (code == null ? 0 : code === 3 ? 0.8 : code >= 51 ? 0.9 : code === 2 ? 0.3 : 0);
  out.gloom = clamp(0.6 * cloudPart + 0.4 * clamp((out.rainProb || 0) / 100));
  out.grey = out.gloom >= 0.5;
  out.label = weatherLabel(out);
  return out;
}
export function weatherLabel(w) {
  if (!w || w.tempMean == null) return 'no forecast';
  const parts = [`${Math.round(w.tempMean)}°`];
  if (w.feelsMean != null && Math.abs(w.feelsMean - w.tempMean) >= 2) parts.push(`feels ${Math.round(w.feelsMean)}°`);
  if (w.muggy) parts.push('muggy'); else if (w.humidity != null && w.humidity < 40) parts.push('dry');
  if (w.rainProb >= 50) parts.push(`${Math.round(w.rainProb)}% rain`); else if (w.desc && w.desc !== 'clear' && w.desc !== 'partly cloudy') parts.push(w.desc);
  else if (w.cloud != null && w.cloud >= 80) parts.push('overcast');
  if (w.wind >= 28) parts.push('windy');
  return parts.join(' · ');
}

// ---------- wear window ----------
const atHour = (d, h, m = 0) => { const x = new Date(d); x.setHours(h, m, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtH = d => { const h = d.getHours(), m = d.getMinutes(), mm = m ? `:${String(m).padStart(2, '0')}` : ''; return h === 0 ? `12${mm}am` : h < 12 ? `${h}${mm}am` : h === 12 ? `12${mm}pm` : `${h - 12}${mm}pm`; };
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function dayWord(d, now) {
  const a = atHour(now, 0), b = atHour(d, 0), diff = Math.round((b - a) / 864e5);
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : DAY[d.getDay()];
}
function mkWin(start, end, now, preset) {
  const sameDay = atHour(start, 0).getTime() === atHour(end, 0).getTime() || end.getHours() <= 6;
  const dw = dayWord(start, now);
  const isNight = start.getHours() >= 17 || start.getHours() < 5;
  const label = preset === 'now' ? `Now until ${fmtH(end)}` : `${dw === 'Today' && isNight ? 'Tonight' : dw === 'Tomorrow' && isNight ? 'Tomorrow night' : dw} ${fmtH(start)}–${fmtH(end)}`;
  return { start, end, label, preset, hours: (end - start) / 36e5, sameDay };
}
export const WHEN_PRESETS = [
  { id: 'now', label: 'Now' }, { id: 'today', label: 'Today' }, { id: 'tonight', label: 'Tonight' },
  { id: 'tomorrow', label: 'Tomorrow' }, { id: 'tomorrow-night', label: 'Tomorrow night' },
];
/** Window for an explicit preset. Night windows depend a little on the occasion (clubbing runs late). */
export function windowForPreset(preset, occasionId, now = new Date()) {
  const h = now.getHours();
  const nowH = atHour(now, now.getHours());                                   // 'now' windows start on the hour
  // Realistic 'being out' hours — what you dress for, not the 3am low or the 6am chill.
  const nightSpan = occasionId === 'clubbing' ? [21, 25] : occasionId === 'houseparty' ? [19, 23] : occasionId === 'dinner' ? [18.5, 22] :
    occasionId === 'bars' ? [19, 23] : occasionId === 'date' ? [19, 23] : occasionId === 'formal' ? [18, 23] : [18.5, 23];
  const daySpan = occasionId === 'office' ? [9, 17.5] : occasionId === 'beach' ? [10, 16] : occasionId === 'outdoor' ? [12, 17] : [10, 17];
  const span = (base, [a, b]) => mkWin(atHour(base, Math.floor(a), (a % 1) * 60), atHour(base, Math.floor(b), (b % 1) * 60), now, preset);
  switch (preset) {
    case 'now': return mkWin(nowH, nowEnd(nowH), now, preset);
    case 'today': { const w = span(now, daySpan); if (w.start < now) w.start = nowH; if (w.end <= w.start) w.end = new Date(w.start.getTime() + 3 * 36e5); return mkWin(w.start, w.end, now, preset); }
    case 'tonight': { const w = span(now, nightSpan); if (w.start < now) w.start = nowH; if (w.end <= w.start) w.end = new Date(w.start.getTime() + 3 * 36e5); return mkWin(w.start, w.end, now, preset); }
    case 'tomorrow': return span(addDays(now, 1), daySpan);
    case 'tomorrow-night': return span(addDays(now, 1), nightSpan);
  }
  return mkWin(nowH, nowEnd(nowH), now, 'now');
}
function nowEnd(startH) {
  const h = startH.getHours();
  let end = new Date(startH.getTime() + (h < 5 ? 3 : 4) * 36e5);
  if (h >= 18) { const cap = atHour(addDays(startH, 1), 1); if (end > cap) end = cap; }   // evening: stop at 1am
  return end;
}
/** Default wear window for an occasion given the current time (James's "when I'll actually be wearing it"). */
export function inferWindow(occasionId, now = new Date()) {
  const h = now.getHours() + now.getMinutes() / 60, dow = now.getDay();
  const nightOcc = ['bars', 'clubbing', 'houseparty', 'dinner', 'date', 'formal'];
  if (occasionId === 'office') {
    if (dow >= 1 && dow <= 5 && h < 15) return windowForPreset('today', occasionId, now);
    let d = addDays(now, 1); while (d.getDay() === 0 || d.getDay() === 6) d = addDays(d, 1);
    const isTomorrow = atHour(d, 0).getTime() === atHour(addDays(now, 1), 0).getTime();
    return mkWin(atHour(d, 9), atHour(d, 17, 30), now, isTomorrow ? 'tomorrow' : 'auto');
  }
  if (occasionId === 'casual') return windowForPreset('now', occasionId, now);
  if (occasionId === 'beach' || occasionId === 'outdoor') return h < 14.5 ? windowForPreset('today', occasionId, now) : windowForPreset('tomorrow', occasionId, now);
  if (nightOcc.includes(occasionId)) {
    if ((occasionId === 'clubbing' || occasionId === 'bars' || occasionId === 'houseparty') && h < 4) return windowForPreset('now', occasionId, now);
    return h < 23.5 ? windowForPreset('tonight', occasionId, now) : windowForPreset('tomorrow-night', occasionId, now);
  }
  return windowForPreset('now', occasionId, now);
}

// ---------- per-bottle evidence ----------
function manualToCharts(m) {
  // Convert a user's own tags (for bottles with no community data) into pseudo-charts.
  const season = { Spring: 0, Summer: 0, Fall: 0, Winter: 0 }, occ = { Business: 0, Daily: 0, Leisure: 0, Sport: 0, Evening: 0, 'Night Out': 0 };
  const sm = { hot: 'Summer', warm: 'Spring', mild: 'Fall', cool: 'Winter' };
  (m.seasons || []).forEach(s => { if (sm[s]) season[sm[s]] += 100 / m.seasons.length; });
  (m.occasions || []).forEach(o => { const w = OCC_W[o]; if (!w) return; const tot = Object.values(w).reduce((a, b) => a + b, 0) || 1; for (const [c, wt] of Object.entries(w)) occ[c] += 100 * wt / tot / m.occasions.length; });
  return { season: { pct: season, votes: m.seasons?.length ? 30 : 0 }, occasion: { pct: occ, votes: m.occasions?.length ? 30 : 0 }, type: null };
}
function evidence(b) {
  const c = b.community || {};
  const r = c.ratings || {};
  const charts = c.charts && c.charts.season ? c.charts : (b.manual ? manualToCharts(b.manual) : {});
  const strengthMap = { light: 6.3, moderate: 7.5, strong: 8.6 }, longMap = { short: 6.0, medium: 7.5, long: 8.8 };
  const scent = r.scent?.avg != null ? r.scent : { avg: b.manual?.rating ?? null, votes: b.manual?.rating ? 5 : 0 };
  const longevity = r.longevity?.avg != null ? r.longevity : { avg: longMap[b.manual?.longevity] ?? null, votes: b.manual?.longevity ? 5 : 0 };
  const sillage = r.sillage?.avg != null ? r.sillage : { avg: strengthMap[b.manual?.strength] ?? null, votes: b.manual?.strength ? 5 : 0 };
  const type = charts.type?.pct || {};
  const T = k => type[k] || 0;
  const fresh = clamp((T('Fresh') + T('Citrus') + T('Aquatic') + T('Green') + 0.5 * T('Fruity') + 0.3 * T('Floral')) / 100);
  const heavy = clamp((T('Sweet') + T('Gourmand') + T('Oriental') + T('Resinous') + 0.6 * T('Creamy') + 0.6 * T('Spicy') + 0.7 * T('Leathery') + 0.7 * T('Smoky') + 0.4 * T('Powdery') + T('Animal') + 0.3 * T('Earthy') + 0.2 * T('Woody')) / 100);
  const hasCommunity = !!(c.ratings && c.ratings.scent && c.charts && c.charts.occasion);
  const SUN_NOTES = /coconut|lime|sea |sea$|salt|marine|sugar cane|rum|pineapple|mango|passion ?fruit|hibiscus|tiar|mono[iï]|ylang|frangipani|solar/i;
  const noteList = Object.values(b.notes || {}).flat().filter(Boolean);
  const sunNotes = noteList.filter(n => SUN_NOTES.test(n)).length;
  const sunType = (T('Aquatic') * 1.0 + T('Citrus') * 0.5 + T('Fruity') * 0.5 + T('Fresh') * 0.35 + T('Creamy') * 0.3) / 100;
  const sunniness = clamp(sunType + Math.min(0.4, 0.1 * sunNotes));
  const tropical = clamp((sunniness - 0.25) / 0.4);     // 0 for most scents, ~1 for a lime-coconut-rum aquatic
  return { scent, longevity, sillage, charts, fresh, heavy, hasCommunity, manual: !!b.manual && !hasCommunity, sunniness, tropical };
}

// ---------- main ----------
/**
 * rank({ collection, occasionId, variant, window, weather, corrections, now })
 *  collection: { bottles: [...] } ; weather: output of summarizeWeather (may be null) ;
 *  corrections: { [bottleId]: { hidden?: bool, global?: -2..2, [occasionId]?: -2..2 } }
 */
export function rank({ collection, occasionId, variant = null, window: win, weather, corrections = {} }) {
  const occ = occasionById(occasionId) || OCCASIONS[1];
  const key = variant && OCC_W[`${occasionId}:${variant}`] ? `${occasionId}:${variant}` : occasionId;
  const W = WEIGHTS[occasionId] || WEIGHTS.default;
  const occW = OCC_W[key] || OCC_W.casual;
  const hours = clamp(Math.max(win?.hours || 0, occ.duration || 4), 3, 10);
  const nightShare = weather?.nightShare != null ? weather.nightShare : (win ? nightShareOf(win) : 0.5);
  const outside = weather?.feelsMean ?? weather?.tempMean ?? 24;          // fallback: a typical Brisbane day
  const shownTemp = weather?.tempMean ?? outside;
  const Teff = occ.indoor * occ.indoorTemp + (1 - occ.indoor) * outside;  // what the scent will actually experience
  const heat = clamp((Teff - 18) / 14);                                    // 0 at 18°, 1 at 32°
  const heatOut = clamp((outside - 18) / 14);
  const extremity = 1 + 0.6 * Math.max(0, heatOut - 0.7) / 0.3 + 0.4 * Math.max(0, 0.15 - heatOut) / 0.15; // up to x1.6 in a heatwave
  const wW = W.w * extremity;
  const sw = seasonWeights(Teff);
  const results = [];
  for (const b of collection.bottles || []) {
    const corr = corrections[b.id] || {};
    if (corr.hidden || b.removed) continue;
    const ev = evidence(b);
    const occPct = ev.charts.occasion?.pct || {}, occVotes = ev.charts.occasion?.votes || 0;
    const seaPct = ev.charts.season?.pct || {}, seaVotes = ev.charts.season?.votes || 0;
    // occasion
    const occRaw = weighted(occPct, occW);
    const occFit = shrinkFit(clamp((occRaw - 0.15) / 0.40), occVotes);
    // weather: season chart at the effective temperature, nudged by type (fresh vs heavy)
    const seaRaw = weighted(seaPct, sw);
    let typeMod = (ev.fresh - ev.heavy) * (heat - 0.5) * 0.5;
    if (weather?.muggy) typeMod -= ev.heavy * 0.15 * (1 - 0.5 * occ.indoor);
    const weaFit = clamp(shrinkFit(clamp((seaRaw - 0.10) / 0.60), seaVotes) + typeMod);
    // time of day
    const nightVotes = ((occPct['Evening'] || 0) + (occPct['Night Out'] || 0)) / 100;
    const timeChart = nightShare * nightVotes + (1 - nightShare) * (1 - nightVotes);
    const timeType = nightShare * clamp(0.5 + ev.heavy - ev.fresh) + (1 - nightShare) * clamp(0.5 + ev.fresh - ev.heavy);
    const timeFit = ev.charts.type ? 0.6 * timeChart + 0.4 * timeType : timeChart;
    // quality / appeal
    const q = shrink(ev.scent.avg, ev.scent.votes, PRIOR_SCENT, K_RATING);
    const qFit = clamp((q - 6.8) / 2.0);
    // longevity
    const L = shrink(ev.longevity.avg, ev.longevity.votes, PRIOR_PERF, K_RATING);
    const isExtrait = /extrait|parfum\b(?! de toilette)/i.test(b.concentration || '') && !/eau de parfum/i.test(b.concentration || '');
    let hoursEst = clamp(1.5 * L - 4, 2, 14) * (1 - 0.15 * heat + 0.05) * (isExtrait ? 1.1 : 1);
    const lFit = Math.pow(clamp(hoursEst / hours), 0.7);
    // sprays
    const S = shrink(ev.sillage.avg, ev.sillage.votes, PRIOR_PERF, K_RATING);
    let sprays = S >= 8.3 ? 3 : S >= 7.6 ? 4 : S >= 7.0 ? 5 : 6;
    const sprayWhy = [];
    if (heat >= 0.71) { sprays -= 1; sprayWhy.push(weather?.muggy ? 'muggy heat amplifies it' : 'heat amplifies it'); }
    else if (heat <= 0.08) { sprays += 1; sprayWhy.push('cool air mutes it'); }
    if (occ.close) { sprays -= 1; sprayWhy.push("you'll be close to people"); }
    if (occ.loud) { sprays += 1; sprayWhy.push(occ.indoor >= 0.5 ? 'busy, crowded space' : occ.indoor >= 0.3 ? 'busy venue' : 'open air thins it out'); }
    if (isExtrait) { sprays -= 1; sprayWhy.push('extrait strength'); }
    if ((weather?.wind || 0) >= 28 && occ.indoor < 0.5) { sprays += 1; sprayWhy.push('windy'); }
    sprays = clamp(sprays, 2, 6);
    hoursEst *= 1 + 0.06 * (sprays - 4);
    // bonuses specific to the brief
    let bonus = 0;
    if (occasionId === 'date') bonus += 0.08 * clamp(ev.heavy * 1.3) * (1 - 0.6 * heat); // "meant to be sexy": warm/sweet, unless it's hot
    if (occasionId === 'formal') bonus += 0.04 * ((ev.charts.audience_style?.pct?.Classic || 0) / 100);
    if (occasionId === 'beach') bonus += 0.08 * ev.fresh;
    if (occasionId === 'outdoor') bonus += 0.04 * ev.fresh;
    const popularity = 0.03 * clamp(Math.log10((ev.scent.votes || 0) + 1) / 3.3);
    // Sky: a beach-in-a-bottle scent wants sun. Only matters in daylight and outside (or lightly sheltered).
    const gloom = weather?.gloom || 0;
    const skyExposure = (1 - nightShare) * (1 - 0.5 * occ.indoor);
    const skyPenalty = 0.16 * ev.tropical * gloom * skyExposure;
    const skyBonus = 0.04 * ev.heavy * gloom * skyExposure;
    bonus += skyBonus - skyPenalty;
    const dressy = { dinner: 1, formal: 1, office: 0.9, date: 0.8, bars: 0.3 }[occasionId] || 0;
    const dressPenalty = 0.07 * ev.tropical * dressy;
    bonus -= dressPenalty;
    const steps = clamp((corr.global || 0), -2, 2) + clamp((corr[occasionId] || 0), -2, 2);
    const base = W.q * qFit + W.o * occFit + wW * weaFit + W.t * timeFit + W.l * lFit + bonus + popularity;
    const score = Math.round(100 * base + 6 * steps);
    const thin = [];
    if (ev.hasCommunity) { if (occVotes < 30) thin.push('occasion'); if (seaVotes < 30) thin.push('season'); if ((ev.scent.votes || 0) < 30) thin.push('rating'); }
    results.push({
      bottle: b, score, steps,
      fit: { quality: qFit, occasion: occFit, weather: weaFit, time: timeFit, longevity: lFit },
      sprays: { n: sprays, why: sprayWhy.slice(0, 2).join(', '), where: sprays <= 3 ? 'neck and chest' : sprays <= 5 ? 'neck, chest and wrists' : 'neck, chest, wrists and a spray on clothing' },
      longevity: { hours: hoursEst, range: [Math.max(1, Math.round(hoursEst * 0.85)), Math.round(hoursEst * 1.15)], enough: hoursEst >= hours * 0.9, needed: hours },
      sky: { penalty: Math.round(100 * skyPenalty), bonus: Math.round(100 * skyBonus), gloom },
      dressPenalty: Math.round(100 * dressPenalty),
      reason: reasonFor({ b, ev, occW, occPct, occVotes, seaPct, seaVotes, Teff, outside: shownTemp, occ, skyPenalty, skyBonus, weaFit, occFit, qFit, heat, weather, nightShare, manual: ev.manual, hasCommunity: ev.hasCommunity, steps }),
      thin, manual: ev.manual, noData: !ev.hasCommunity && !ev.manual,
      context: { Teff: Math.round(Teff), outside: Math.round(shownTemp), heat, nightShare },
    });
  }
  results.sort((a, b) => b.score - a.score);
  const top = results.length ? results[0].score : 0;
  results.forEach((r, i) => {
    r.rankIndex = i + 1;
    const gap = top - r.score;
    let g = (r.score >= 72 && gap <= 3) ? 'Great' : (r.score >= 60 && gap <= 10) ? 'Good' : (r.score >= 50 || gap <= 20) ? 'OK' : 'Poor';
    if (g === 'Great' && (r.fit.weather < 0.3 || r.fit.occasion < 0.35)) g = 'Good';   // honest badge when the reason carries a 'but'
    const order = ['Poor', 'OK', 'Good', 'Great'];
    if (i > 0) g = order[Math.min(order.indexOf(g), order.indexOf(results[i - 1].grade))];
    r.grade = g;
  });
  return results;
}

function nightShareOf(win) {
  let n = 0, tot = 0;
  for (let t = win.start.getTime(); t < win.end.getTime(); t += 36e5) { const h = new Date(t).getHours(); tot++; if (h >= 18 || h < 6) n++; }
  return tot ? n / tot : 0.5;
}

function reasonFor({ b, ev, occW, occPct, occVotes, seaPct, seaVotes, Teff, outside, occ, skyPenalty = 0, skyBonus = 0, weaFit, occFit, qFit, heat, weather, nightShare, manual, hasCommunity, steps }) {
  if (!hasCommunity && !manual) return 'No community data yet — ranked on defaults. Add your own tags in Collection.';
  if (manual) return 'Ranked from your own tags (no community data for this bottle).';
  const pick = Object.entries(occPct).filter(([c]) => occW[c] > 0).sort((x, y) => y[1] * occW[y[0]] - x[1] * occW[x[0]]);
  const top = pick[0], second = pick[1];
  let occClause;
  if (!top || top[1] < 10) {
    const best = Object.entries(occPct).sort((x, y) => y[1] - x[1])[0];
    occClause = best ? `voters lean ${CAT_LABEL[best[0]] || best[0]} (${best[1]}%), not ${occ.label.toLowerCase()}` : 'little occasion data';
  } else if (second && second[1] >= 15 && occW[second[0]] >= 0.5) {
    occClause = `${top[1]}% ${CAT_LABEL[top[0]]} and ${second[1]}% ${CAT_LABEL[second[0]]} votes`;
  } else occClause = `${top[1]}% ${CAT_LABEL[top[0]]} votes`;
  // weather clause
  const sortedSea = Object.entries(seaPct).sort((x, y) => y[1] - x[1]);
  const topSea = sortedSea[0];
  const o = Math.round(outside);
  const seaName = s => ({ Spring: 'spring', Summer: 'summer', Fall: 'autumn', Winter: 'winter' })[s] || s;
  const sheltered = occ.indoor >= 0.5;
  const hotOut = o >= 28, coolOut = o <= 17;
  let weaClause = '';
  if (topSea) {
    const heavyScent = topSea[0] === 'Winter' || topSea[0] === 'Fall';
    const lightScent = topSea[0] === 'Summer' || topSea[0] === 'Spring';
    if (weaFit >= 0.62) weaClause = `${topSea[1]}% ${seaName(topSea[0])} votes suit ${o}°${weather?.muggy && lightScent ? ' and the humidity' : ''}`;
    else if (weaFit <= 0.38) {
      if (heavyScent && heat >= 0.55) weaClause = `but it is ${topSea[0] === 'Fall' ? 'an' : 'a'} ${seaName(topSea[0])} scent (${topSea[1]}%, ${seaPct.Summer || 0}% summer) for ${o}°${weather?.muggy ? ' and muggy' : ''}${sheltered ? ', even with AC' : ''}`;
      else if (lightScent && heat <= 0.3) weaClause = `but it is a ${seaName(topSea[0])} scent (${topSea[1]}%) for a cool ${o}°`;
      else weaClause = `but only ${seaPct[heat >= 0.5 ? 'Summer' : 'Winter'] || 0}% ${heat >= 0.5 ? 'summer' : 'winter'} votes for ${o}°`;
    } else {
      if (sheltered && hotOut) weaClause = `${o}° outside but mostly indoors, so it holds up`;
      else if (sheltered && coolOut && lightScent) weaClause = `cool ${o}° outside but fine indoors`;
      else weaClause = `${topSea[1]}% ${seaName(topSea[0])} votes, okay for ${o}°`;
    }
  }
  const qClause = qFit >= 0.75 && ev.scent.votes >= 100 ? `rated ${ev.scent.avg} by ${ev.scent.votes.toLocaleString()}` : '';
  const skyWord = weather?.rainProb >= 60 ? (weather?.desc && /rain|shower|drizzle|storm/.test(weather.desc) ? weather.desc : 'likely rain') : 'overcast';
  let s = occClause.charAt(0).toUpperCase() + occClause.slice(1);
  if (skyPenalty >= 0.07) s += `, but it is a sunny-day scent and the sky is ${skyWord}`;
  else if (skyPenalty >= 0.035) s += `; ${weaClause ? weaClause + ', though ' : ''}a bit bright for a ${skyWord} day`;
  else if (weaClause) s += (weaClause.startsWith('but') ? ', ' : '; ') + weaClause;
  if (skyBonus >= 0.02 && !weaClause.startsWith('but')) s += `; suits a grey, ${weather?.rainProb >= 60 ? 'wet' : 'dull'} day`;
  if (qClause && s.length < 80) s += `; ${qClause}`;
  if (steps) s += steps > 0 ? ' · you boosted this' : ' · you marked this down';
  return s + '.';
}

/** Human description of what the engine is doing with the weather, for the header strip. */
export function contextLine(occasionId, weather, win) {
  const occ = occasionById(occasionId);
  if (!weather || weather.tempMean == null) return `${win?.label || ''} · no forecast (offline?)`;
  const parts = [win?.label, weather.label];
  if (occ && occ.indoor >= 0.5) parts.push('partly indoors');
  return parts.filter(Boolean).join(' · ');
}
