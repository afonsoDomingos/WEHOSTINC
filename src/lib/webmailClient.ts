import { apiEndpoint } from './siteConfig';

export interface WebmailAttachment {
  url: string;
  name: string;
  size?: number;
  type?: string;
}

export interface WebmailMessage {
  id: string;
  uid?: number;
  accountEmail: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  textPreview?: string;
  date: string;
  isRead: boolean;
  starred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  avatarColor?: string;
  attachments?: WebmailAttachment[];
}

// Limites de anexos
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
export const ATTACHMENT_MAX_COUNT = 5; // Maximo de 5 anexos por email
export const ATTACHMENT_TOTAL_MAX_SIZE = 25 * 1024 * 1024; // 25MB total por email

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_drafts';

// Mapeamento de pasta UI -> nome IMAP real (Migadu)
export const FOLDER_IMAP_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
};

export const webmailManager = {
  isRealEmailAvailable: (email: string, password: string): boolean => {
    return !!(email && password);
  },

  /**
   * Busca mensagens de uma pasta especifica via IMAP (Migadu).
   * Usa query string em GET para que os parametros cheguem ao servidor.
   * Rascunhos ficam no localStorage (locais, nao sincronizados com IMAP).
   */
  getMessages: async (
    accountEmail?: string,
    password?: string,
    folder: 'inbox' | 'sent' | 'drafts' | 'trash' = 'inbox'
  ): Promise<WebmailMessage[]> => {
    // Rascunhos - sempre localStorage local
    if (folder === 'drafts') {
      return webmailManager.getDrafts(accountEmail);
    }

    // Mensagens reais via IMAP
    if (accountEmail && password) {
      try {
        const imapFolder = FOLDER_IMAP_MAP[folder] || 'INBOX';
        const params = new URLSearchParams({
          email: accountEmail,
          password,
          folder: imapFolder,
        });

        const res = await fetch(apiEndpoint(`/api/webmail/messages?${params.toString()}`), {
          method: 'GET',
        });

        if (res.ok) {
          const data = await res.json();
          return (data.messages || []).map((msg: WebmailMessage) => ({
            ...msg,
            folder,
            accountEmail,
          }));
        } else {
          console.error('[Webmail] Server error fetching messages:', res.status);
          return [];
        }
      } catch (error) {
        console.error('[Webmail] API fetch failed:', error);
        return [];
      }
    }

    return [];
  },

  sendMessage: async (
    accountEmail: string,
    password: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: WebmailAttachment[]
  ): Promise<WebmailMessage> => {
    const res = await fetch(apiEndpoint('/api/webmail/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: accountEmail,
        password,
        to: toEmail,
        subject,
        body,
        attachments,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Nao foi possivel enviar o email.');
    }

    return {
      id: `smtp-${Date.now()}`,
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'sent',
      avatarColor: 'bg-primary-600',
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };
  },

  toggleStar: async (
    msgId: string,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/toggle-star'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            folder: imapFolder || 'INBOX',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API toggle star failed:', error);
      }
    }
  },

  markAsRead: async (
    msgId: string,
    isRead = true,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/mark-read'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            isRead,
            folder: imapFolder || 'INBOX',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API mark as read failed:', error);
      }
    }
  },

  moveFolder: async (
    msgId: string,
    newFolder: 'inbox' | 'sent' | 'drafts' | 'trash',
    accountEmail?: string,
    password?: string,
    uid?: number,
    fromImapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/move'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            fromFolder: fromImapFolder || 'INBOX',
            toFolder: FOLDER_IMAP_MAP[newFolder] || 'Trash',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API move folder failed:', error);
      }
    }
  },

  deletePermanently: async (
    msgId: string,
    accountEmail?: string,
    password?: string,
    uid?: number,
    imapFolder?: string
  ): Promise<void> => {
    if (accountEmail && password && uid) {
      try {
        await fetch(apiEndpoint('/api/webmail/delete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            folder: imapFolder || 'INBOX',
          }),
        });
      } catch (error) {
        console.error('[Webmail] API delete failed:', error);
      }
    }
    // Remove from local drafts if it is a draft
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(WEBMAIL_STORAGE_KEY);
      if (stored) {
        const drafts: WebmailMessage[] = JSON.parse(stored);
        const filtered = drafts.filter((m) => m.id !== msgId);
        localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(filtered));
      }
    }
  },

  saveDraft: async (
    accountEmail: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: WebmailAttachment[],
    password?: string
  ): Promise<WebmailMessage> => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(WEBMAIL_STORAGE_KEY) : null;
    const drafts: WebmailMessage[] = stored ? JSON.parse(stored) : [];

    const existingIdx = drafts.findIndex(
      (m) =>
        m.folder === 'drafts' &&
        m.accountEmail.toLowerCase() === accountEmail.toLowerCase() &&
        m.toEmail.toLowerCase() === toEmail.toLowerCase() &&
        m.subject.toLowerCase() === subject.toLowerCase()
    );

    const draftData = {
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      folder: 'drafts' as const,
      avatarColor: 'bg-gray-500',
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    if (existingIdx !== -1) {
      drafts[existingIdx] = { ...drafts[existingIdx], ...draftData };
    } else {
      drafts.unshift({ id: `draft-${Date.now()}`, ...draftData });
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(WEBMAIL_STORAGE_KEY, JSON.stringify(drafts));
    }

    return existingIdx !== -1 ? drafts[existingIdx] : drafts[0];
  },

  getDrafts: async (accountEmail?: string, password?: string): Promise<WebmailMessage[]> => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(WEBMAIL_STORAGE_KEY) : null;
    const drafts: WebmailMessage[] = stored ? JSON.parse(stored) : [];
    if (accountEmail) {
      return drafts.filter((m) => m.accountEmail.toLowerCase() === accountEmail.toLowerCase());
    }
    return drafts;
  },
};
