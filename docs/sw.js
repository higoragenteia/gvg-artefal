/* GVG&ARTEFAL — shell PWA. Nunca armazena dados operacionais do Apps Script. */
const CACHE = 'gvg-shell-v3';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon-32.png',
  './favicon-48.png',
  './favicon-180.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE)
      .then(function(cache){ return Promise.allSettled(SHELL.map(function(url){ return cache.add(url); })); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(keys){ return Promise.all(keys.filter(function(key){ return key !== CACHE; }).map(function(key){ return caches.delete(key); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  const request = event.request;
  if(request.method !== 'GET') return;
  let url;
  try{ url = new URL(request.url); }catch(e){ return; }
  // O painel e os módulos ficam em script.google.com; o service worker do
  // GitHub Pages não controla esse conteúdo e não deve armazenar dados.
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith(
      fetch(request)
        .then(function(response){
          if(response && response.ok){
            const copy = response.clone();
            caches.open(CACHE).then(function(cache){ cache.put(request, copy); });
          }
          return response;
        })
        .catch(function(){
          return caches.match(request).then(function(cached){
            return cached || caches.match('./index.html');
          });
        })
    );
    return;
  }

  // Arquivos estáticos do shell: responde do cache e atualiza em segundo plano.
  event.respondWith(
    caches.match(request).then(function(cached){
      const network = fetch(request).then(function(response){
        if(response && response.ok){
          const copy = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(request, copy); });
        }
        return response;
      }).catch(function(){ return cached; });
      return cached || network;
    })
  );
});
