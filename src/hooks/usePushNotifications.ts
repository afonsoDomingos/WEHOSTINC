import { useState, useEffect } from 'react';

interface PushSubscriptionState {
  permission: NotificationPermission;
  subscription: PushSubscription | null;
  error: string | null;
  loading: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    permission: 'default',
    subscription: null,
    error: null,
    loading: false
  });

  useEffect(() => {
    // Verificar permissão inicial
    if ('Notification' in window) {
      setState(prev => ({ ...prev, permission: Notification.permission }));
    }

    // Verificar subscription existente
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({ ...prev, subscription }));
      }
    } catch (error) {
      console.error('[Push Notifications] Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      setState(prev => ({ ...prev, error: 'Este navegador não suporta notificações' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, loading: false }));

      if (permission === 'granted') {
        await subscribeToPush();
        return true;
      } else {
        setState(prev => ({ ...prev, error: 'Permissão de notificação negada' }));
        return false;
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao solicitar permissão',
        loading: false 
      }));
      return false;
    }
  };

  const subscribeToPush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Service Worker ou Push API não suportado');
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push Notifications] Service Worker registrado:', registration);

      // Verificar subscription existente
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setState(prev => ({ ...prev, subscription: existingSubscription }));
        return existingSubscription;
      }

      // Converter VAPID key para Uint8Array
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // Criar nova subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      // Enviar subscription para o servidor
      await sendSubscriptionToServer(subscription);

      setState(prev => ({ ...prev, subscription }));
      console.log('[Push Notifications] Subscription criada:', subscription);

      return subscription;
    } catch (error) {
      console.error('[Push Notifications] Erro ao criar subscription:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erro ao criar subscription'
      }));
      throw error;
    }
  };

  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('[Push Notifications] User ID não encontrado');
        return;
      }

      const subscriptionData = {
        userId,
        subscription: subscription.toJSON()
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      console.log('[Push Notifications] Subscription enviada para o servidor');
    } catch (error) {
      console.error('[Push Notifications] Erro ao enviar subscription:', error);
      throw error;
    }
  };

  const unsubscribe = async () => {
    try {
      if (state.subscription) {
        await state.subscription.unsubscribe();
        
        // Remover do servidor
        const userId = localStorage.getItem('userId');
        if (userId) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });
        }

        setState(prev => ({ ...prev, subscription: null }));
        console.log('[Push Notifications] Unsubscribe realizado');
      }
    } catch (error) {
      console.error('[Push Notifications] Erro ao unsubscribe:', error);
      throw error;
    }
  };

  return {
    ...state,
    requestPermission,
    subscribeToPush,
    unsubscribe,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  };
}

// Helper para converter VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
