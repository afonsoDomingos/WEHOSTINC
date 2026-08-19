// Service Worker para notificações push
const CACHE_NAME = 'wehosthere-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/dashboard/notifications'
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
    })
  );
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
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
          // Verifica se resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone da resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Recebimento de notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);

  const data = event.data.json();
  
  const options = {
    body: data.message || 'Nova notificação',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard/notifications',
      notificationId: data.notificationId
    },
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/logo.png'
      }
    ],
    tag: data.orderId || 'sales-notification',
    requireInteraction: true,
    renotify: true
  };

  // Personalização baseada no tipo de notificação
  if (data.type === 'new_sale') {
    options.title = '🎉 Nova Venda Realizada';
    options.badge = '/badge-sale.png';
  } else if (data.type === 'subscription_renewal') {
    options.title = '🔄 Renovação de Assinatura';
    options.badge = '/badge-renewal.png';
  } else if (data.type === 'upgrade') {
    options.title = '⬆️ Upgrade Realizado';
    options.badge = '/badge-upgrade.png';
  } else if (data.type === 'refund') {
    options.title = '💰 Reembolso Processado';
    options.badge = '/badge-refund.png';
  } else if (data.type === 'payment_failed') {
    options.title = '⚠️ Falha no Pagamento';
    options.badge = '/badge-error.png';
  } else {
    options.title = data.title || 'Nova Notificação';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);

  event.notification.close();

  if (event.action === 'view') {
    const data = event.notification.data;
    const urlToOpen = data.url || '/dashboard/notifications';

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Verifica se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Se não, abre uma nova janela
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'close') {
    // Apenas fecha a notificação
  } else {
    // Comportamento padrão: abrir URL
    const data = event.notification.data;
    const urlToOpen = data.url || '/dashboard/notifications';

    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event);
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // Sincroniza notificações não lidas
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      console.log('[Service Worker] Notificações sincronizadas');
    }
  } catch (error) {
    console.error('[Service Worker] Erro ao sincronizar:', error);
  }
}
