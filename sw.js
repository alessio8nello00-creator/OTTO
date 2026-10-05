// Service worker Gestiotto: offline, aggiornamenti e notifiche push.
const CACHE = 'gestiotto-v10';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // API e server: mai in cache
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

// Notifica in arrivo dal server
self.addEventListener('push', e => {
  let m = { title: 'Gestiotto', body: '' };
  try { m = e.data.json(); } catch { if (e.data) m.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(m.title || 'Gestiotto', { body: m.body || '', tag: m.tag, icon: 'icon-192.png', badge: 'icon-192.png' }));
});
// Tocco sulla notifica: apre l'app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow('./index.html');
  }));
});
