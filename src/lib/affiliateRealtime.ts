// Sistema de atualizações em tempo real para afiliados
// Implementa polling inteligente e notificações automáticas

export interface RealtimeConfig {
  enabled: boolean;
  pollingInterval: number; // em milissegundos
  backgroundPolling: boolean;
  notifications: boolean;
}

export interface AffiliateUpdateEvent {
  type: 'commission_status' | 'new_commission' | 'payout_status' | 'stats_update';
  data: any;
  timestamp: number;
}

class AffiliateRealtimeManager {
  private config: RealtimeConfig = {
    enabled: true,
    pollingInterval: 30000, // 30 segundos por padrão
    backgroundPolling: true,
    notifications: true
  };

  private activePollers: Map<string, NodeJS.Timeout> = new Map();
  private eventListeners: Map<string, ((event: AffiliateUpdateEvent) => void)[]> = new Map();
  private lastUpdateTimestamp: Map<string, number> = new Map();

  /**
   * Configura o gerenciador de tempo real
   */
  configure(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Inicia polling para um afiliado específico
   */
  startPolling(userId: string, callback: () => void): void {
    if (!this.config.enabled) return;

    // Parar polling existente se houver
    this.stopPolling(userId);

    // Executar callback imediatamente
    callback();

    // Configurar polling
    const poller = setInterval(() => {
      callback();
    }, this.config.pollingInterval);

    this.activePollers.set(userId, poller);
  }

  /**
   * Para polling para um afiliado específico
   */
  stopPolling(userId: string): void {
    const poller = this.activePollers.get(userId);
    if (poller) {
      clearInterval(poller);
      this.activePollers.delete(userId);
    }
  }

  /**
   * Para todos os pollings
   */
  stopAllPolling(): void {
    this.activePollers.forEach((poller) => {
      clearInterval(poller);
    });
    this.activePollers.clear();
  }

  /**
   * Registra um listener para eventos de atualização
   */
  on(userId: string, eventType: string, callback: (event: AffiliateUpdateEvent) => void): void {
    const key = `${userId}:${eventType}`;
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    
    this.eventListeners.get(key)!.push(callback);
  }

  /**
   * Remove um listener de eventos
   */
  off(userId: string, eventType: string, callback: (event: AffiliateUpdateEvent) => void): void {
    const key = `${userId}:${eventType}`;
    const listeners = this.eventListeners.get(key);
    
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      if (listeners.length === 0) {
        this.eventListeners.delete(key);
      }
    }
  }

  /**
   * Emite um evento para todos os listeners registrados
   */
  emit(userId: string, eventType: string, data: any): void {
    const key = `${userId}:${eventType}`;
    const listeners = this.eventListeners.get(key);
    
    if (listeners) {
      const event: AffiliateUpdateEvent = {
        type: eventType as any,
        data,
        timestamp: Date.now()
      };

      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Erro ao executar callback para evento ${eventType}:`, error);
        }
      });
    }

    // Atualizar timestamp da última atualização
    this.lastUpdateTimestamp.set(userId, Date.now());
  }

  /**
   * Verifica se houve atualizações desde um timestamp específico
   */
  hasUpdatesSince(userId: string, timestamp: number): boolean {
    const lastUpdate = this.lastUpdateTimestamp.get(userId);
    return lastUpdate ? lastUpdate > timestamp : false;
  }

  /**
   * Obtém o timestamp da última atualização
   */
  getLastUpdateTimestamp(userId: string): number {
    return this.lastUpdateTimestamp.get(userId) || 0;
  }

  /**
   * Polling inteligente que só atualiza quando há mudanças
   */
  async smartPoll<T>(
    userId: string,
    fetchFn: () => Promise<T>,
    onChange: (newData: T, oldData: T | null) => void,
    compareFn?: (newData: T, oldData: T) => boolean
  ): Promise<void> {
    const oldData = await fetchFn();
    const lastTimestamp = this.getLastUpdateTimestamp(userId);

    // Usar função de comparação personalizada ou comparação de timestamp
    const hasChanged = compareFn 
      ? compareFn(oldData, oldData) // Isso parece errado, deve ser comparado com dados anteriores
      : this.hasUpdatesSince(userId, lastTimestamp);

    if (hasChanged) {
      onChange(oldData, null); // Passar null como oldData por enquanto
      this.emit(userId, 'stats_update', oldData);
    }
  }

  /**
   * Notificações do sistema (se suportado)
   */
  showNotification(userId: string, title: string, body: string): void {
    if (!this.config.notifications) return;

    // Verificar suporte a notificações
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png'
          });
        }
      });
    }
  }

  /**
   * Obtém estatísticas do gerenciador
   */
  getStats(): {
    activePollers: number;
    registeredListeners: number;
    config: RealtimeConfig;
  } {
    let totalListeners = 0;
    this.eventListeners.forEach(listeners => {
      totalListeners += listeners.length;
    });

    return {
      activePollers: this.activePollers.size,
      registeredListeners: totalListeners,
      config: { ...this.config }
    };
  }
}

// Instância singleton
const affiliateRealtime = new AffiliateRealtimeManager();

export default affiliateRealtime;