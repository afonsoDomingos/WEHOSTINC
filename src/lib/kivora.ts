export interface KivoraC2BRequest {
  phone: string; // MSISDN local, sem +258 (ex: 841234567)
  amount: number;
  currency?: string; // Predefinição: MZN
  reference?: string; // Referência externa (ex: ORDER-1001)
  description?: string; // Descrição do pagamento
  senderName?: string; // Nome da entidade que aparece no telemóvel do cliente (ex: WEHOSTHERE)
  metadata?: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    serviceName?: string;
  }; // Metadados para notificações
}

export interface KivoraC2BResponse {
  id: string; // Identificador do pagamento (pay_xxxxx)
  status: 'pending' | 'processing' | 'paid' | 'failed';
  amount: number;
  currency: string;
  reference?: string;
  createdAt?: string; // Data de criação (presente em consultas GET)
}

export interface KivoraB2CRequest {
  phone: string;
  amount: number;
  currency?: string;
  reference?: string;
}

export interface KivoraB2CResponse {
  id: string; // Identificador do envio (out_xxxxx)
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  reference?: string;
  createdAt?: string;
}

export interface KivoraCustomer {
  name?: string;
  email?: string;
  phone?: string;
}

export interface KivoraSubscriptionRequest {
  customer: KivoraCustomer;
  amount: number;
  currency?: string; // Predefinição: MZN
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  reference?: string; // Referência externa opcional
}

export interface KivoraSubscriptionResponse {
  id: string; // Identificador da assinatura (sub_xxxxx)
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  amount: number;
  currency: string;
  interval: string;
  reference?: string;
  createdAt?: string;
}

export interface KivoraError {
  error: {
    code: string;
    message: string;
  };
}

const KIVORA_BASE_URL = process.env.KIVORA_BASE_URL || 'https://kivorapayments-nu.vercel.app';
const KIVORA_API_KEY = process.env.KIVORA_API_KEY || '';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${KIVORA_API_KEY}`
});

export const kivora = {
  // Iniciar cobrança C2B (Customer to Business)
  createC2BPayment: async (data: KivoraC2BRequest): Promise<KivoraC2BResponse> => {
    // Normalizar número de telefone (remover +258 se presente)
    let phone = data.phone.replace(/\D/g, '');
    if (phone.startsWith('258')) {
      phone = phone.substring(3);
    }

    const payload = {
      phone,
      amount: data.amount,
      currency: data.currency || 'MZN',
      reference: data.reference,
      description: data.description,
      senderName: data.senderName || 'WEHOSTHERE', // Nome da entidade que aparece no telemóvel
      metadata: data.metadata // Incluir metadados do cliente para notificações
    };

    try {
      console.log('[KIVORA C2B] Iniciando cobrança:', payload);

      const response = await fetch(`${KIVORA_BASE_URL}/v1/c2b`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('[KIVORA C2B] Response status:', response.status);
      console.log('[KIVORA C2B] Response body:', responseText);

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraC2BResponse = JSON.parse(responseText);
      console.log('[KIVORA C2B] Pagamento criado:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA C2B] Erro ao criar pagamento:', error);
      throw error;
    }
  },

  // Consultar status de pagamento C2B
  getC2BPayment: async (paymentId: string): Promise<KivoraC2BResponse> => {
    try {
      console.log('[KIVORA C2B] Consultando pagamento:', paymentId);

      const response = await fetch(`${KIVORA_BASE_URL}/v1/c2b/${paymentId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      const responseText = await response.text();
      console.log('[KIVORA C2B] Response status:', response.status);

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraC2BResponse = JSON.parse(responseText);
      console.log('[KIVORA C2B] Status do pagamento:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA C2B] Erro ao consultar pagamento:', error);
      throw error;
    }
  },

  // Enviar dinheiro B2C (Business to Customer)
  createB2CPayout: async (data: KivoraB2CRequest): Promise<KivoraB2CResponse> => {
    // Normalizar número de telefone
    let phone = data.phone.replace(/\D/g, '');
    if (phone.startsWith('258')) {
      phone = phone.substring(3);
    }

    const payload = {
      phone,
      amount: data.amount,
      currency: data.currency || 'MZN',
      reference: data.reference
    };

    try {
      console.log('[KIVORA B2C] Iniciando envio:', payload);

      const response = await fetch(`${KIVORA_BASE_URL}/v1/b2c`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('[KIVORA B2C] Response status:', response.status);

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraB2CResponse = JSON.parse(responseText);
      console.log('[KIVORA B2C] Envio criado:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA B2C] Erro ao criar envio:', error);
      throw error;
    }
  },

  // Consultar status de envio B2C
  getB2CPayout: async (transactionId: string): Promise<KivoraB2CResponse> => {
    try {
      console.log('[KIVORA B2C] Consultando envio:', transactionId);

      const response = await fetch(`${KIVORA_BASE_URL}/v1/b2c/${transactionId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraB2CResponse = JSON.parse(responseText);
      console.log('[KIVORA B2C] Status do envio:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA B2C] Erro ao consultar envio:', error);
      throw error;
    }
  },

  // Criar assinatura recorrente
  createSubscription: async (data: KivoraSubscriptionRequest): Promise<KivoraSubscriptionResponse> => {
    try {
      console.log('[KIVORA SUBSCRIPTION] Criando assinatura:', data);

      const payload = {
        customer: data.customer,
        amount: data.amount,
        currency: data.currency || 'MZN',
        interval: data.interval,
        reference: data.reference
      };

      const response = await fetch(`${KIVORA_BASE_URL}/v1/subscriptions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('[KIVORA SUBSCRIPTION] Response status:', response.status);
      console.log('[KIVORA SUBSCRIPTION] Response body:', responseText);

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraSubscriptionResponse = JSON.parse(responseText);
      console.log('[KIVORA SUBSCRIPTION] Assinatura criada:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA SUBSCRIPTION] Erro ao criar assinatura:', error);
      throw error;
    }
  },

  // Consultar status de assinatura
  getSubscription: async (subscriptionId: string): Promise<KivoraSubscriptionResponse> => {
    try {
      console.log('[KIVORA SUBSCRIPTION] Consultando assinatura:', subscriptionId);

      const response = await fetch(`${KIVORA_BASE_URL}/v1/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: getHeaders()
      });

      const responseText = await response.text();

      if (!response.ok) {
        const errorData: KivoraError = JSON.parse(responseText);
        throw new Error(errorData.error?.message || `Erro Kivora: ${response.status}`);
      }

      const result: KivoraSubscriptionResponse = JSON.parse(responseText);
      console.log('[KIVORA SUBSCRIPTION] Status da assinatura:', result);
      return result;
    } catch (error) {
      console.error('[KIVORA SUBSCRIPTION] Erro ao consultar assinatura:', error);
      throw error;
    }
  }
};
