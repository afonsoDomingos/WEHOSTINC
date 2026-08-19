// Service Worker para WEHOSTHERE PWA
const CACHE_NAME = 'wehosthere-v2';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/admin',
  '/admin/settings',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Forçar ativação imediata do novo service worker
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Reclamar clientes imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições - Network First para navegação, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para requisições de navegação, usar Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonar resposta e adicionar ao cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Se falhar, tentar do cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para outros recursos, usar Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }
        // Clone da requisição
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verificar se resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação da WEHOSTHERE',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/logo.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WEHOSTHERE', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/notifications')
    );
  } else if (event.action === 'close') {
    // Fechar notificação
  } else {
    // Ação padrão - abrir dashboard
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});
