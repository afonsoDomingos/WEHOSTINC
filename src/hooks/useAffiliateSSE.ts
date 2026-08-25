// Hook React para usar Server-Sent Events de afiliados
import { useState, useEffect, useCallback, useRef } from 'react';

export interface AffiliateSSEEvent {
  type: 'connected' | 'stats_update' | 'error' | 'commission_status' | 'payout_status';
  data?: any;
  error?: string;
  timestamp: number;
  message?: string;
}

export function useAffiliateSSE(userId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<AffiliateSSEEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!userId || eventSourceRef.current) return;

    const eventSource = new EventSource(`/api/affiliates/events?userId=${encodeURIComponent(userId)}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('[AffiliateSSE] Conectado ao stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AffiliateSSEEvent;
        setLastEvent(data);
        
        if (data.type === 'error') {
          setError(data.error || 'Erro desconhecido');
        }
        
        console.log('[AffiliateSSE] Evento recebido:', data.type);
      } catch (err) {
        console.error('[AffiliateSSE] Erro ao parsear evento:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[AffiliateSSE] Erro na conexão SSE:', err);
      setIsConnected(false);
      setError('Erro na conexão de atualizações em tempo real');
      
      // Tentar reconectar após 5 segundos
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          connect();
        }
      }, 5000);
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log('[AffiliateSSE] Desconectado do stream');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    reconnect: connect,
    disconnect
  };
}