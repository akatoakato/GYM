// Дикий Лось — service worker: приложение открывается мгновенно и без интернета.
// Стратегия «сначала из кэша, в фоне обновить»: новая версия с GitHub
// подхватывается при следующем открытии. При заметных изменениях
// увеличьте номер версии, чтобы очистить старый кэш.
const CACHE = 'moose-v3.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // запросы к Google Apps Script и любые POST идут напрямую в сеть
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const network = fetch(req).then(res => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  });

  e.respondWith(
    caches.match(req, { ignoreSearch: true })
      .then(cached => cached || network)
      .catch(() => network)
  );
  e.waitUntil(network.then(() => {}, () => {}));
});
