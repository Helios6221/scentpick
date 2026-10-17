// Scent Pick — Open-Meteo forecast for Sherwood (Brisbane): fetch, cache freshness, per-window summary, debug override.
// No DOM access; `fetch` is only used when fetchForecast() is called.
import { summarizeWeather, weatherLabel } from './engine.js';

export const LOCATION = { name: 'Sherwood, Brisbane', lat: -27.53, lon: 152.98 };
export const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-27.53&longitude=152.98'
  + '&hourly=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,weather_code,cloud_cover,wind_speed_10m,is_day,uv_index'
  + '&forecast_days=4&timezone=Australia%2FBrisbane';
export const MAX_AGE_MS = 60 * 60 * 1000;

export const isStale = (cache, now = Date.now()) => !cache || !cache.fetchedAt || now - cache.fetchedAt > MAX_AGE_MS;

/** Fetch the forecast; resolves to { fetchedAt, hourly } or throws. Times out after 10 s. */
export async function fetchForecast(fetchImpl = globalThis.fetch) {
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl && setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetchImpl(FORECAST_URL, { signal: ctrl?.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json?.hourly?.time?.length) throw new Error('empty forecast');
    return { fetchedAt: Date.now(), hourly: json.hourly };
  } finally { if (timer) clearTimeout(timer); }
}

/** "12 min ago", "3h ago", "2 days ago". */
export function ageText(fetchedAt, now = Date.now()) {
  const m = Math.max(0, Math.round((now - fetchedAt) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)}h ago`;
  return `${Math.round(m / 1440)} days ago`;
}

/** Weather summary for a wear window: forecast (if cached) with the debug override applied on top. */
export function weatherForWindow(cache, win, override) {
  const w = cache?.hourly ? summarizeWeather(cache.hourly, win) : null;
  return override ? applyOverride(w, override) : w;
}

/** Accepts {temp|tempMean, feels, humidity, rain|rainProb, cloud (0–100), wind, nightShare}; drops empty values. Null if nothing set. */
export function cleanOverride(o) {
  if (!o || typeof o !== 'object') return null;
  const pick = (...keys) => { for (const k of keys) { const v = o[k]; if (v !== '' && v != null && Number.isFinite(+v)) return +v; } return null; };
  const out = { temp: pick('temp', 'tempMean'), feels: pick('feels', 'feelsMean'), humidity: pick('humidity'),
    rain: pick('rain', 'rainProb'), cloud: pick('cloud', 'cloud_cover'), wind: pick('wind'), nightShare: pick('nightShare') };
  const clamp = (v, hi) => Math.max(0, Math.min(hi, v));
  if (out.nightShare != null) out.nightShare = clamp(out.nightShare, 1);
  if (out.cloud != null) out.cloud = clamp(out.cloud, 100);
  if (out.rain != null) out.rain = clamp(out.rain, 100);
  for (const k of Object.keys(out)) if (out[k] == null) delete out[k];
  return Object.keys(out).length ? out : null;
}

/** Overlay debug values on a summary (or on nothing), recomputing the derived muggy/gloom/grey flags and label
 *  exactly as engine.js summarizeWeather() does (keep the two in step if the engine's formulas change). */
export function applyOverride(w, o) {
  const out = { ...(w || { rainProb: 0, wind: 0, desc: null, code: null, note: null }), overridden: true };
  if (o.temp != null) { out.tempMean = out.tempMax = out.tempMin = o.temp; out.feelsMean = o.feels ?? o.temp; }
  else if (o.feels != null) out.feelsMean = o.feels;
  if (o.humidity != null) out.humidity = o.humidity;
  if (o.rain != null) out.rainProb = o.rain;
  if (o.cloud != null) out.cloud = o.cloud;
  if (o.wind != null) out.wind = o.wind;
  if (o.nightShare != null) out.nightShare = o.nightShare;
  if (out.tempMean == null) out.tempMean = out.feelsMean = 24; // override without any forecast: assume a typical day
  out.muggy = out.humidity != null && out.humidity >= 72 && out.feelsMean >= 24;
  const c01 = v => Math.max(0, Math.min(1, v)), code = out.code;
  const cloudPart = out.cloud != null ? c01((out.cloud - 40) / 50)
    : (code == null ? 0 : code === 3 ? 0.8 : code >= 51 ? 0.9 : code === 2 ? 0.3 : 0);
  out.gloom = c01(0.6 * cloudPart + 0.4 * c01((out.rainProb || 0) / 100));
  out.grey = out.gloom >= 0.5;
  out.label = weatherLabel(out);
  return out;
}
