// Facebook Pixel Tracking Utility
// Usado para rastrear eventos de conversão em todo o site

declare global {
  interface Window {
    fbq?: any;
  }
}

export const FacebookPixel = {
  // Inicializa o Facebook Pixel (já feito no layout.tsx)
  init: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      console.log('[Facebook Pixel] Já inicializado');
    }
  },

  // Rastreia visualização de página (já feito no layout.tsx)
  trackPageView: () => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      console.log('[Facebook Pixel] PageView rastreado');
    }
  },

  // Rastreia quando um usuário inicia o processo de registro
  trackLead: (data?: { content_name?: string; content_category?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', data || {});
      console.log('[Facebook Pixel] Lead rastreado', data);
    }
  },

  // Rastreia quando um usuário inicia o processo de checkout
  trackInitiateCheckout: (data: {
    content_ids?: string[];
    content_name: string;
    content_category: string;
    value: number;
    currency: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: data.content_ids || [],
        content_name: data.content_name,
        content_category: data.content_category,
        value: data.value,
        currency: data.currency,
      });
      console.log('[Facebook Pixel] InitiateCheckout rastreado', data);
    }
  },

  // Rastreia quando um pagamento é concluído com sucesso
  trackPurchase: (data: {
    content_ids?: string[];
    content_name: string;
    content_category: string;
    value: number;
    currency: string;
    transaction_id: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: data.content_ids || [],
        content_name: data.content_name,
        content_category: data.content_category,
        value: data.value,
        currency: data.currency,
        transaction_id: data.transaction_id,
      });
      console.log('[Facebook Pixel] Purchase rastreado', data);
    }
  },

  // Rastreia quando um usuário solicita contato/orçamento
  trackContact: (data?: { content_name?: string }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact', data || {});
      console.log('[Facebook Pixel] Contact rastreado', data);
    }
  },

  // Rastreia visualização de conteúdo específico
  trackViewContent: (data: {
    content_name: string;
    content_category: string;
    value?: number;
    currency?: string;
  }) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: data.content_name,
        content_category: data.content_category,
        value: data.value,
        currency: data.currency,
      });
      console.log('[Facebook Pixel] ViewContent rastreado', data);
    }
  },

  // Rastreia evento personalizado
  trackCustom: (eventName: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, data || {});
      console.log(`[Facebook Pixel] Custom event "${eventName}" rastreado`, data);
    }
  },
};

export default FacebookPixel;
