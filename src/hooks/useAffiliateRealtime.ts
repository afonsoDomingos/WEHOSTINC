// Hook React para usar o gerenciador de tempo real de afiliados
import { useState, useEffect } from 'react';
import affiliateRealtime, { AffiliateUpdateEvent } from '@/lib/affiliateRealtime';

export function useAffiliateRealtime(userId: string) {
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    // Callback de polling
    const pollCallback = async () => {
      setIsPolling(true);
      try {
        // Buscar dados atualizados
        const response = await fetch(`/api/affiliates/dashboard?userId=${encodeURIComponent(userId)}&bypassCache=true`);
        if (response.ok) {
          const data = await response.json();
          setLastUpdate(Date.now());
          
          // Emitir evento de atualização
          affiliateRealtime.emit(userId, 'stats_update', data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados atualizados:', error);
      } finally {
        setIsPolling(false);
      }
    };

    // Iniciar polling
    affiliateRealtime.startPolling(userId, pollCallback);

    // Listener para eventos
    const handleUpdate = (event: AffiliateUpdateEvent) => {
      setLastUpdate(event.timestamp);
      
      if (event.type === 'commission_status' && affiliateRealtime['config']?.notifications) {
        affiliateRealtime.showNotification(
          userId,
          'Atualização de Comissão',
          'O status da sua comissão foi atualizado!'
        );
      }
    };

    affiliateRealtime.on(userId, 'commission_status', handleUpdate);
    affiliateRealtime.on(userId, 'stats_update', handleUpdate);

    // Cleanup
    return () => {
      affiliateRealtime.stopPolling(userId);
      affiliateRealtime.off(userId, 'commission_status', handleUpdate);
      affiliateRealtime.off(userId, 'stats_update', handleUpdate);
    };
  }, [userId]);

  return {
    lastUpdate,
    isPolling,
    hasUpdates: (timestamp: number) => affiliateRealtime.hasUpdatesSince(userId, timestamp),
    emit: (eventType: string, data: any) => affiliateRealtime.emit(userId, eventType, data)
  };
}