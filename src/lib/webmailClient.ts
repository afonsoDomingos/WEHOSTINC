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
  pinned?: boolean;
  priority?: 'high' | 'normal' | 'low';
  folder: 'inbox' | 'sent' | 'drafts' | 'trash';
  avatarColor?: string;
  attachments?: WebmailAttachment[];
}

// Limites de anexos
export const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB em bytes
export const ATTACHMENT_MAX_COUNT = 5; // Maximo de 5 anexos por email
export const ATTACHMENT_TOTAL_MAX_SIZE = 25 * 1024 * 1024; // 25MB total por email

const WEBMAIL_STORAGE_KEY = 'wehosthere_webmail_drafts';
const WEBMAIL_PINNED_KEY = 'wehosthere_webmail_pinned';
const WEBMAIL_PRIORITY_KEY = 'wehosthere_webmail_priorities';

// Mapeamento de pasta UI -> nome IMAP real (Migadu)
export const FOLDER_IMAP_MAP: Record<string, string> = {
  inbox: 'INBOX',
  sent: 'Sent',
  drafts: 'Drafts',
  trash: 'Trash',
};

const WEBMAIL_SENT_KEY = 'wehosthere_webmail_sent_cache';

export const webmailManager = {
  isRealEmailAvailable: (email: string, password: string): boolean => {
    return !!(email && password);
  },

  getPinnedSet: (accountEmail?: string): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const key = `${WEBMAIL_PINNED_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const data = localStorage.getItem(key);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch {
      return new Set();
    }
  },

  togglePin: (msgId: string, accountEmail?: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const key = `${WEBMAIL_PINNED_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const pinnedSet = webmailManager.getPinnedSet(accountEmail);
      let isPinned = false;
      if (pinnedSet.has(msgId)) {
        pinnedSet.delete(msgId);
        isPinned = false;
      } else {
        pinnedSet.add(msgId);
        isPinned = true;
      }
      localStorage.setItem(key, JSON.stringify(Array.from(pinnedSet)));
      return isPinned;
    } catch {
      return false;
    }
  },

  getPriorityMap: (accountEmail?: string): Record<string, 'high' | 'normal' | 'low'> => {
    if (typeof window === 'undefined') return {};
    try {
      const key = `${WEBMAIL_PRIORITY_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  setMessagePriority: (msgId: string, priority: 'high' | 'normal' | 'low', accountEmail?: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const key = `${WEBMAIL_PRIORITY_KEY}_${(accountEmail || 'default').toLowerCase()}`;
      const map = webmailManager.getPriorityMap(accountEmail);
      map[msgId] = priority;
      localStorage.setItem(key, JSON.stringify(map));
    } catch {}
  },

  /**
   * Busca mensagens de uma pasta especifica via IMAP (Migadu) com sincronização em tempo real.
   */
  getMessages: async (
    accountEmail?: string,
    password?: string,
    folder: 'inbox' | 'sent' | 'drafts' | 'trash' = 'inbox'
  ): Promise<WebmailMessage[]> => {
    const pinnedSet = webmailManager.getPinnedSet(accountEmail);
    const priorityMap = webmailManager.getPriorityMap(accountEmail);

    const enrichMessage = (msg: WebmailMessage): WebmailMessage => {
      const isPinned = pinnedSet.has(msg.id) || !!msg.pinned;
      const customPriority = priorityMap[msg.id];
      let effectivePriority = customPriority || msg.priority || 'normal';
      if (!customPriority && !msg.priority) {
        const subj = (msg.subject || '').toUpperCase();
        if (subj.includes('URGENTE') || subj.includes('PRIORIDADE ALTA') || subj.includes('[HIGH]') || subj.includes('[URGENT]')) {
          effectivePriority = 'high';
        }
      }
      return {
        ...msg,
        pinned: isPinned,
        priority: effectivePriority
      };
    };

    const sortMessages = (list: WebmailMessage[]) => {
      return [...list].sort((a, b) => {
        // Pinned messages first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then by date descending
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    };

    // 1. Rascunhos (Local + IMAP se disponível)
    if (folder === 'drafts') {
      const localDrafts = await webmailManager.getDrafts(accountEmail);
      if (accountEmail && password) {
        try {
          const params = new URLSearchParams({
            email: accountEmail,
            password,
            folder: 'Drafts',
          });
          const res = await fetch(apiEndpoint(`/api/webmail/messages?${params.toString()}`));
          if (res.ok) {
            const data = await res.json();
            const imapDrafts = (data.messages || []).map((msg: WebmailMessage) => ({
              ...msg,
              folder: 'drafts' as const,
              accountEmail,
            }));
            // Merge deduping by subject and date
            const combined = [...localDrafts];
            for (const idraft of imapDrafts) {
              if (!combined.some(d => d.subject === idraft.subject && Math.abs(new Date(d.date).getTime() - new Date(idraft.date).getTime()) < 60000)) {
                combined.push(idraft);
              }
            }
            return sortMessages(combined.map(enrichMessage));
          }
        } catch {}
      }
      return sortMessages(localDrafts.map(enrichMessage));
    }

    // 2. Mensagens via IMAP (Inbox, Sent, Trash)
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

        let imapMsgs: WebmailMessage[] = [];
        if (res.ok) {
          const data = await res.json();
          imapMsgs = (data.messages || []).map((msg: WebmailMessage) => ({
            ...msg,
            folder,
            accountEmail,
          }));
        }

        // Para pasta "Enviados" (sent), mesclar com cache local para exibição instantânea
        if (folder === 'sent') {
          const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
          const sentCache: WebmailMessage[] = localSent ? JSON.parse(localSent) : [];
          
          // Mesclar mensagens mantendo ordenação por data mais recente
          const allSent = [...imapMsgs];
          for (const localMsg of sentCache) {
            const alreadyInImap = allSent.some(m => 
              m.subject === localMsg.subject && 
              m.toEmail === localMsg.toEmail &&
              Math.abs(new Date(m.date).getTime() - new Date(localMsg.date).getTime()) < 120000
            );
            if (!alreadyInImap) {
              allSent.push(localMsg);
            }
          }
          return sortMessages(allSent.map(enrichMessage));
        }

        return sortMessages(imapMsgs.map(enrichMessage));
      } catch (error) {
        console.error('[Webmail] API fetch failed:', error);
        if (folder === 'sent') {
          const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
          const list = localSent ? JSON.parse(localSent) : [];
          return sortMessages(list.map(enrichMessage));
        }
        return [];
      }
    }

    // Fallback para sent local se sem credenciais
    if (folder === 'sent' && accountEmail) {
      const localSent = typeof window !== 'undefined' ? localStorage.getItem(`${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`) : null;
      const list = localSent ? JSON.parse(localSent) : [];
      return sortMessages(list.map(enrichMessage));
    }

    return [];
  },

  sendMessage: async (
    accountEmail: string,
    password: string,
    toEmail: string,
    subject: string,
    body: string,
    attachments?: WebmailAttachment[],
    priority: 'high' | 'normal' | 'low' = 'normal'
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
        priority,
        attachments,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Nao foi possivel enviar o email.');
    }

    const sentMessage: WebmailMessage = {
      id: `sent-${Date.now()}`,
      accountEmail,
      fromName: accountEmail.split('@')[0],
      fromEmail: accountEmail,
      toEmail,
      subject,
      body,
      date: new Date().toISOString(),
      isRead: true,
      starred: false,
      priority,
      folder: 'sent',
      avatarColor: 'bg-primary-600',
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    };

    // Salvar no cache local de enviados
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
        const existing = localStorage.getItem(cacheKey);
        const list: WebmailMessage[] = existing ? JSON.parse(existing) : [];
        list.unshift(sentMessage);
        localStorage.setItem(cacheKey, JSON.stringify(list.slice(0, 100)));
      } catch {}
    }

    return sentMessage;
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
        const res = await fetch(apiEndpoint('/api/webmail/move'), {
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
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[Webmail] Move failed:', data.error);
        }
      } catch (error) {
        console.error('[Webmail] API move folder failed:', error);
      }
    }
    // If moving from sent, remove from local sent cache
    if (typeof window !== 'undefined' && accountEmail && fromImapFolder === 'Sent') {
      const sentKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
      const stored = localStorage.getItem(sentKey);
      if (stored) {
        const sentList: WebmailMessage[] = JSON.parse(stored);
        const filtered = sentList.filter((m) => m.id !== msgId && (uid ? m.uid !== uid : true));
        localStorage.setItem(sentKey, JSON.stringify(filtered));
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
        const res = await fetch(apiEndpoint('/api/webmail/delete'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: accountEmail,
            password,
            uid,
            folder: imapFolder || 'INBOX',
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('[Webmail] Delete failed:', data.error);
        }
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
      // Remove from local sent cache
      if (accountEmail) {
        const sentKey = `${WEBMAIL_SENT_KEY}_${accountEmail.toLowerCase()}`;
        const storedSent = localStorage.getItem(sentKey);
        if (storedSent) {
          const sentList: WebmailMessage[] = JSON.parse(storedSent);
          const filteredSent = sentList.filter((m) => m.id !== msgId && (uid ? m.uid !== uid : true));
          localStorage.setItem(sentKey, JSON.stringify(filteredSent));
        }
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
