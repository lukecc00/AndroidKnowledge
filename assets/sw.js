const CACHE = 'ak-cache-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { self.clients.claim(); });
async function networkFirst(req) {
  try {
    const res = await fetch(req, { cache: 'no-store' });
    const c = await caches.open(CACHE);
    c.put(req, res.clone());
    return res;
  } catch {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    if (hit) return hit;
    throw new Error('offline');
  }
}
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const p = url.pathname;
  if (p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.json') || p.endsWith('.md') || p.endsWith('.svg')) {
    e.respondWith(networkFirst(e.request));
  }
});
