export interface HostingCredentials {
  username: string;
  password: string;
  cpanelUrl: string;
  webmailUrl: string;
  nameserver1: string;
  nameserver2: string;
}

export function generateHostingCredentials(orderId: string, clientEmail: string): HostingCredentials {
  // Extrair prefixo limpo do e-mail
  const emailPrefix = clientEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const username = `whh_${emailPrefix || 'user'}_${randomSuffix}`;

  // Gerar password segura aleatória de 12 carateres
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  let password = 'WHH-';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return {
    username,
    password,
    cpanelUrl: 'https://wehosthere.com/dashboard/sites',
    webmailUrl: 'https://wehosthere.com/webmail',
    nameserver1: 'ns1.wehosthere.com',
    nameserver2: 'ns2.wehosthere.com'
  };
}
