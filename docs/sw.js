// Scent Pick — service worker. Bump VERSION whenever any shell file changes (see README-dev.md).
const VERSION = 'v20261017-2030';
const CACHE = `scentpick-${VERSION}`;
const DATA = './data/collection.json';
const SHELL = [
  './', './index.html', './app.css', './app.js', './engine.js', './store.js', './weather.js', './manifest.webmanifest',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', DATA,
];

self.addEventListener('install', event => {
  // cache: 'reload' bypasses the HTTP cache so a new version never precaches stale files.
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const old = (await caches.keys()).filter(k => k.startsWith('scentpick-') && k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    // Only an update (old caches existed) is announced; a first install is silent.
    if (old.length) {
      for (const client of await self.clients.matchAll({ type: 'window' })) client.postMessage({ type: 'updated', version: VERSION });
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'version' && event.source) event.source.postMessage({ type: 'version', version: VERSION });
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Open-Meteo, Parfumo links: straight to the network
  if (url.pathname.endsWith('/data/collection.json')) { event.respondWith(networkFirst(req)); return; }
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreSearch: true })
    || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') cache.put(req, res.clone());
  return res;
}

/** Fresh data when online (gives up after 4 s), cached copy when offline or slow. */
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    if (res.ok) await cache.put(DATA, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(DATA);
    if (hit) return hit;
    throw err;
  }
}
