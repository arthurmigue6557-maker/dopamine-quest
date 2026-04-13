// sw.js - Service Worker para PWA com cache offline avançado (CORRIGIDO)
const CACHE_NAME = 'dopamine-quest-v4.0.0';
const OFFLINE_URL = '/offline.html';

// Arquivos essenciais para cache (core) - APENAS arquivos que realmente existem
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/css/custom.css'
];

// Arquivos JavaScript (cache separado para evitar falhas)
const JS_CACHE_URLS = [
  '/js/main.js',
  '/js/surprise.js'
];

// Páginas secundárias (se não existirem, não causam falha)
const PAGES_CACHE_URLS = [
  '/about.html',
  '/privacy.html',
  '/terms.html'
];

// CDN assets
const CDN_CACHE_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Função auxiliar para cache seguro (não quebra se um arquivo falhar)
async function safeCacheAdd(cache, urls) {
  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response && response.ok) {
          await cache.put(url, response);
          console.log(`[SW] Cacheado com sucesso: ${url}`);
          return { url, status: 'success' };
        } else {
          console.warn(`[SW] Falha ao cachear: ${url} - Status: ${response?.status}`);
          return { url, status: 'failed', reason: `HTTP ${response?.status}` };
        }
      } catch (error) {
        console.error(`[SW] Erro ao cachear ${url}:`, error);
        return { url, status: 'failed', reason: error.message };
      }
    })
  );
  
  const succeeded = results.filter(r => r.value?.status === 'success').length;
  const failed = results.filter(r => r.value?.status === 'failed').length;
  console.log(`[SW] Cache concluído: ${succeeded} sucesso, ${failed} falhas`);
  return results;
}

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando versão:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache de arquivos estáticos locais (essenciais)
        console.log('[SW] Cacheando assets estáticos...');
        await safeCacheAdd(cache, STATIC_CACHE_URLS);
        
        // Cache de JavaScript (essenciais)
        console.log('[SW] Cacheando JavaScript...');
        await safeCacheAdd(cache, JS_CACHE_URLS);
        
        // Cache de páginas secundárias (opcionais)
        console.log('[SW] Cacheando páginas secundárias...');
        await safeCacheAdd(cache, PAGES_CACHE_URLS);
        
        // Cache de CDNs
        console.log('[SW] Cacheando CDNs...');
        await safeCacheAdd(cache, CDN_CACHE_URLS);
        
        // Cache da página offline
        try {
          const offlineResponse = await fetch(OFFLINE_URL);
          if (offlineResponse && offlineResponse.ok) {
            await cache.put(OFFLINE_URL, offlineResponse);
            console.log('[SW] Offline page cacheada com sucesso');
          }
        } catch (error) {
          console.error('[SW] Erro ao cachear offline page:', error);
        }
        
        console.log('[SW] Instalação concluída!');
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Erro fatal na instalação:', error);
      }
    })()
  );
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando versão:', CACHE_NAME);
  
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(async (cacheName) => {
        if (cacheName !== CACHE_NAME && cacheName.startsWith('dopamine-quest')) {
          console.log('[SW] Removendo cache antigo:', cacheName);
          await caches.delete(cacheName);
        }
      });
      await Promise.all(deletePromises);
      console.log('[SW] Ativação concluída, reivindicando clientes...');
      await self.clients.claim();
    })()
  );
});

// Estratégia de fetch: Network First com fallback inteligente
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições não-HTTP/HTTPS
  if (!url.protocol.startsWith('http')) return;
  
  // Ignorar requisições de analytics, extensões e navegador
  const ignorePatterns = ['chrome-extension', 'safari-extension', 'analytics', 'google-analytics'];
  if (ignorePatterns.some(pattern => url.pathname.includes(pattern))) return;
  
  // Ignorar requisições de API (se houver no futuro)
  if (url.pathname.startsWith('/api/')) return;

  // Para navegação (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // Cachear a resposta para uso offline futuro
          if (response && response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] Offline - buscando página em cache para:', request.url);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) {
            return offlinePage;
          }
          // Fallback extremo
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Você está offline</h1><p>Conecte-se à internet para usar o Dopamine Quest.</p></body></html>',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
            }
          );
        })
    );
    return;
  }

  // Para arquivos estáticos (Cache First)
  const isStaticAsset = STATIC_CACHE_URLS.some(url => request.url.includes(url)) ||
                        JS_CACHE_URLS.some(url => request.url.includes(url)) ||
                        request.destination === 'style' ||
                        request.destination === 'script';
  
  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          console.warn('[SW] Asset não encontrado em cache nem online:', request.url);
          // Fallback para CSS/JS vazio
          if (request.destination === 'style') {
            return new Response('/* Fallback CSS */', { headers: { 'Content-Type': 'text/css' } });
          }
          if (request.destination === 'script') {
            return new Response('// Fallback JS', { headers: { 'Content-Type': 'application/javascript' } });
          }
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Para imagens e outros assets: Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return cachedResponse || new Response('', { status: 404 });
        });
      return cachedResponse || fetchPromise;
    })
  );
});

// Sincronização em background (otimizada)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync em background:', event.tag);
  if (event.tag === 'sync-completions') {
    event.waitUntil(syncCompletions());
  }
});

// Push notifications (com verificação)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Dopamine Quest', body: event.data.text() };
  }
  
  const options = {
    body: data.body || 'Hora de focar e ganhar dopamina! 🧠',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || '/'
    },
    actions: [
      { action: 'focus', title: '🎯 Iniciar Foco' },
      { action: 'dismiss', title: '⏰ Depois' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dopamine Quest', options)
  );
});

// Tratamento de notificações clicadas
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'focus') {
    event.waitUntil(
      clients.openWindow('/index.html?action=startFocus')
    );
  } else if (event.action === 'dismiss') {
    // Apenas fecha a notificação
    return;
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Se já existe uma janela aberta, foca nela
          for (let client of windowClients) {
            if (client.url.includes(urlToOpen) && 'focus' in client) {
              return client.focus();
            }
          }
          // Senão, abre uma nova
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Função de sync (placeholder para implementação futura)
async function syncCompletions() {
  console.log('[SW] Sincronizando completações offline');
  // Aqui você pode implementar sync com IndexedDB quando necessário
  // Exemplo: buscar dados salvos offline e enviar para o servidor
}

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});