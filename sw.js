// Service Worker — Maxibell Sistema de Orçamento
const CACHE = 'maxibell-v1';
const ARQUIVOS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instala e faz cache de todos os arquivos na primeira abertura
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Tenta cachear cada arquivo individualmente (falha silenciosa se offline)
      return Promise.allSettled(
        ARQUIVOS.map(url => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve do cache quando offline, busca na rede quando online
self.addEventListener('fetch', e => {
  // Ignora requisições não-GET
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Guarda no cache para próximo uso
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached); // se offline e não tem cache, falha silenciosamente
    })
  );
});
