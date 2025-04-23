// Service Worker para funcionalidade offline do Marcador de Truco

// Nome do cache (versão incrementada para forçar atualização)
const CACHE_NAME = 'truco-marker-cache-v1.6';

// Lista de arquivos essenciais para cachear na instalação
const urlsToCache = [
  '.', // Atalho para index.html na raiz
  'index.html',
  'styles.css', // Adicionado CSS externo
  'app.js',     // Adicionado JS externo
  'manifest.json',
  'sw.js', // O próprio service worker
  'icon-192.png', // Ícone principal
  'icon-512.png'  // Ícone maior
];

// Evento 'install': Chamado quando o Service Worker é instalado.
self.addEventListener('install', event => {
  console.log('[SW] Evento Install:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto. Cacheando arquivos essenciais...');
        const cachePromises = urlsToCache.map(urlToCache => {
            return fetch(urlToCache, {cache: "reload"}) // Força buscar da rede
                .then(response => {
                     if (!response.ok) {
                        console.warn(`[SW] Falha ao buscar ${urlToCache} para cache: ${response.statusText}`);
                        return undefined;
                     }
                     return cache.put(urlToCache, response);
                })
                .catch(err => {
                    console.warn(`[SW] Erro de rede ao tentar cachear ${urlToCache}: ${err}`);
                });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
          console.log("[SW] Recursos essenciais cacheados.");
          return self.skipWaiting(); // Ativa o novo SW imediatamente
      })
      .catch(error => {
          console.error("[SW] Falha na instalação:", error);
      })
  );
});

// Evento 'fetch': Intercepta requisições da página.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Estratégia: Cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('[SW] Retornando do cache:', event.request.url);
          return cachedResponse; // Encontrado no cache
        }
        // Não está no cache, busca na rede
        // console.log('[SW] Buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200) {
              return networkResponse; // Retorna resposta inválida (ex: 404)
            }
            // Clona e guarda no cache a resposta válida da rede
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => { cache.put(event.request, responseToCache); });
            return networkResponse; // Retorna para a página
          }
        ).catch(error => {
            console.warn('[SW] Erro de fetch (Offline?):', event.request.url, error);
            // Opcional: Retornar uma resposta offline padrão
        });
      })
  );
});

// Evento 'activate': Limpa caches antigos.
self.addEventListener('activate', event => {
  console.log('[SW] Evento Activate:', CACHE_NAME);
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deletando cache antigo:', cacheName);
            return caches.delete(cacheName); // Deleta cache antigo
          }
        })
      );
    }).then(() => {
        console.log('[SW] Caches antigos limpos.');
        return self.clients.claim(); // Controla a página imediatamente
    })
  );
});
