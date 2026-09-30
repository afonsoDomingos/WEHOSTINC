import webpush from 'web-push';

// Chaves VAPID persistentes para WEHOSTHERE Push Notifications
// Podem ser sobrepostas por variáveis de ambiente
export const VAPID_PUBLIC_KEY = 
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
  'BBI2fwCeLgQkl3KauPicGM3VLWIUngFBxE5e_tOpSo0aKvXTyStix2mdmvBNNP6_47e8gKGN7KjKHk1lRTPgtuU';

export const VAPID_PRIVATE_KEY = 
  process.env.VAPID_PRIVATE_KEY || 
  'dBOO0sPe-EHE-x6CLhTtSamBO2Jj4Ejb0pLSmBYh3fM';

export const VAPID_EMAIL = 'mailto:info@wehosthere.com';

// Configura o webpush uma única vez de forma consistente
try {
  webpush.setVapidDetails(
    VAPID_EMAIL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} catch (err) {
  console.warn('[VAPID] Erro ao inicializar webpush:', err);
}

export default webpush;
