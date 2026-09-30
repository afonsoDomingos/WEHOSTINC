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
    // Verificar permissão inicial apenas no browser
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setState(prev => ({ ...prev, permission: Notification.permission }));
    }

    // Verificar subscription existente apenas no browser
    if (typeof window !== 'undefined') {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setState(prev => ({ ...prev, subscription }));
      }
    } catch (error) {
      console.error('[Push Notifications] Erro ao verificar subscription:', error);
    }
  };

  const requestPermission = async (metadataOrEvent?: { userId?: string; userEmail?: string; userName?: string; isAdmin?: boolean } | any): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setState(prev => ({ ...prev, error: 'Este navegador não suporta notificações' }));
      return false;
    }

    // Se for invocado diretamente como onClick={requestPermission}, metadataOrEvent é um SyntheticEvent
    const metadata = (metadataOrEvent && typeof metadataOrEvent === 'object' && !('nativeEvent' in metadataOrEvent) && !('preventDefault' in metadataOrEvent))
      ? metadataOrEvent
      : undefined;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, loading: false }));

      if (permission === 'granted') {
        await subscribeToPush(metadata);
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

  const subscribeToPush = async (metadata?: { userId?: string; userEmail?: string; userName?: string; isAdmin?: boolean }) => {
    try {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Service Worker ou Push API não suportado');
      }

      // Registrar service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[Push Notifications] Service Worker registrado:', registration);

      // Converter VAPID key para Uint8Array
      const response = await fetch('/api/push/vapid-key');
      const { publicKey } = await response.json();
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);

      // Verificar subscription existente
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // Criar nova subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Enviar subscription para o servidor com metadados
      await sendSubscriptionToServer(subscription, metadata);

      setState(prev => ({ ...prev, subscription }));
      console.log('[Push Notifications] Subscription ativa:', subscription);

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

  const sendSubscriptionToServer = async (subscription: PushSubscription, metadata?: { userId?: string; userEmail?: string; userName?: string; isAdmin?: boolean }) => {
    try {
      // Auto-detectar usuário do localStorage e session
      let userId = metadata?.userId || (typeof window !== 'undefined' ? localStorage.getItem('userId') : null);
      let userEmail = metadata?.userEmail || null;
      let userName = metadata?.userName || null;
      let isAdmin = metadata?.isAdmin;

      if (typeof window !== 'undefined') {
        try {
          const authUser = localStorage.getItem('wehost_user');
          if (authUser) {
            const parsed = JSON.parse(authUser);
            if (!userId) userId = parsed.id || parsed._id;
            if (!userEmail) userEmail = parsed.email;
            if (!userName) userName = parsed.name;
            if (isAdmin === undefined) isAdmin = parsed.role === 'admin' || parsed.role === 'super_admin';
          }
        } catch (_) {}

        if (isAdmin === undefined && window.location.pathname.startsWith('/admin')) {
          isAdmin = true;
        }
      }

      const isMobileDevice = typeof window !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false;

      const subscriptionData = {
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        userName: userName || undefined,
        isAdmin: Boolean(isAdmin),
        role: isAdmin ? 'admin' : 'user',
        deviceType: isMobileDevice ? 'mobile' : 'desktop',
        subscription: subscription.toJSON()
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      });

      console.log('[Push Notifications] Subscription enviada e sincronizada com sucesso');
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
        const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
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
    isSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
  };
}

// Helper para converter VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
