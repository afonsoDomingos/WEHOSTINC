// Migadu IMAP/SMTP Service
// Handles real IMAP/SMTP connections to Migadu servers with clean email MIME parsing

import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';

export interface IMAPMessage {
  id: string;
  uid: number;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  subject: string;
  date: Date;
  body: string;
  textPreview?: string;
  isRead: boolean;
  starred: boolean;
  priority?: 'high' | 'normal' | 'low';
  folder: string;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
    url?: string;
  }>;
}

export interface SMTPSendOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  priority?: 'high' | 'normal' | 'low';
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

export class MigaduImapSmtpService {
  private imapHost: string;
  private imapPort: number;
  private smtpHost: string;
  private smtpPort: number;

  constructor() {
    this.imapHost = process.env.MIGADU_IMAP_HOST || 'imap.migadu.com';
    this.imapPort = parseInt(process.env.MIGADU_IMAP_PORT || '993');
    this.smtpHost = process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com';
    this.smtpPort = parseInt(process.env.MIGADU_SMTP_PORT || '465');
  }

  /**
   * Authenticate a mailbox via IMAP
   */
  async authenticateIMAP(email: string, password: string): Promise<boolean> {
    try {
      const client = new ImapFlow({
        host: this.imapHost,
        port: this.imapPort,
        secure: this.imapPort === 993,
        auth: {
          user: email,
          pass: password
        },
        logger: false
      });

      try {
        await client.connect();
        await client.logout();
        return true;
      } catch (error) {
        console.error('[MigaduIMAP] Authentication failed for:', email, error);
        return false;
      }
    } catch (error) {
      console.error('[MigaduIMAP] Authentication error for:', email);
      return false;
    }
  }

  /**
   * Resolve exact mailbox path on IMAP server (checking specialUse, standard names, and listing)
   */
  private async resolveMailboxPath(client: ImapFlow, folder: string): Promise<string> {
    const target = folder.toUpperCase();
    try {
      const list = await client.list();
      if (list && list.length > 0) {
        for (const mb of list) {
          const spec = (mb.specialUse || '').toUpperCase();
          const name = (mb.name || '').toUpperCase();
          const path = (mb.path || '').toUpperCase();

          if (target === 'SENT' || target === 'ENVIADOS') {
            if (spec === '\\SENT' || name === 'SENT' || name === 'SENT MESSAGES' || name === 'SENT ITEMS' || path.endsWith('.SENT') || path.endsWith('/SENT') || path === 'SENT') {
              return mb.path;
            }
          } else if (target === 'TRASH' || target === 'LIXEIRA') {
            if (spec === '\\TRASH' || name === 'TRASH' || name === 'DELETED MESSAGES' || name === 'DELETED ITEMS' || path.endsWith('.TRASH') || path.endsWith('/TRASH') || path === 'TRASH') {
              return mb.path;
            }
          } else if (target === 'DRAFTS' || target === 'RASCUNHOS') {
            if (spec === '\\DRAFTS' || name === 'DRAFTS' || path.endsWith('.DRAFTS') || path.endsWith('/DRAFTS') || path === 'DRAFTS') {
              return mb.path;
            }
          } else if (target === 'JUNK' || target === 'SPAM') {
            if (spec === '\\JUNK' || name === 'JUNK' || name === 'SPAM' || path.endsWith('.JUNK') || path.endsWith('.SPAM')) {
              return mb.path;
            }
          } else if (target === 'INBOX' || target === 'ENTRADA') {
            if (spec === '\\INBOX' || name === 'INBOX' || path === 'INBOX') {
              return mb.path;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[MigaduIMAP] list mailboxes error:', e);
    }

    if (target === 'SENT' || target === 'ENVIADOS') return 'Sent';
    if (target === 'TRASH' || target === 'LIXEIRA') return 'Trash';
    if (target === 'DRAFTS' || target === 'RASCUNHOS') return 'Drafts';
    if (target === 'JUNK' || target === 'SPAM') return 'Junk';
    return 'INBOX';
  }

  /**
   * Open mailbox with smart folder name resolution
   */
  private async openMailboxSmart(client: ImapFlow, folder: string) {
    const target = folder.toUpperCase();
    const resolvedPath = await this.resolveMailboxPath(client, folder);

    try {
      const mb = await client.mailboxOpen(resolvedPath);
      if (mb) return mb;
    } catch {
      // If non-inbox mailbox cannot be opened, try creating it first
      if (target !== 'INBOX') {
        try {
          await client.mailboxCreate(resolvedPath);
          return await client.mailboxOpen(resolvedPath);
        } catch {}
      }
    }

    // Try candidate folder paths
    let candidates: string[] = [];
    if (target === 'SENT' || target === 'ENVIADOS') {
      candidates = ['Sent', 'INBOX.Sent', 'Sent Messages', 'Sent Items', 'INBOX/Sent'];
    } else if (target === 'TRASH' || target === 'LIXEIRA') {
      candidates = ['Trash', 'INBOX.Trash', 'Deleted Messages', 'Deleted Items', 'INBOX/Trash'];
    } else if (target === 'DRAFTS' || target === 'RASCUNHOS') {
      candidates = ['Drafts', 'INBOX.Drafts', 'INBOX/Drafts'];
    } else if (target === 'JUNK' || target === 'SPAM') {
      candidates = ['Junk', 'Spam', 'INBOX.Junk'];
    } else {
      candidates = ['INBOX'];
    }

    for (const f of candidates) {
      try {
        const mb = await client.mailboxOpen(f);
        if (mb) return mb;
      } catch {}
    }

    if (target === 'INBOX' || target === 'ENTRADA') {
      return await client.mailboxOpen('INBOX');
    }

    return null;
  }

  /**
   * List messages from a folder (INBOX, Sent, etc.)
   */
  async listMessages(
    email: string,
    password: string,
    folder: string = 'INBOX',
    limit: number = 50
  ): Promise<IMAPMessage[]> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      const mailbox = await this.openMailboxSmart(client, folder);

      if (!mailbox || mailbox.exists === 0) {
        await client.logout();
        return [];
      }

      const messages: IMAPMessage[] = [];
      let count = 0;

      // Fetch all messages in the folder (or up to limit)
      const range = mailbox.exists > limit ? `${mailbox.exists - limit + 1}:*` : '1:*';

      for await (const msg of client.fetch(range, { envelope: true, source: true, flags: true, uid: true })) {
        let cleanBody = '';
        let cleanText = '';
        const parsedAttachments: Array<{
          filename: string;
          size: number;
          contentType: string;
          url?: string;
        }> = [];

        let cleanSubject = '';
        let cleanFromName = '';
        let cleanFromEmail = '';

        if (msg.source) {
          try {
            const parsed = await simpleParser(msg.source);
            cleanBody = (parsed.html as string) || parsed.textAsHtml || parsed.text || '';
            cleanText = (parsed.text || '').replace(/\s+/g, ' ').trim();
            cleanSubject = parsed.subject || '';
            cleanFromName = parsed.from?.value?.[0]?.name || '';
            cleanFromEmail = parsed.from?.value?.[0]?.address || '';

            if (parsed.attachments && parsed.attachments.length > 0) {
              for (const att of parsed.attachments) {
                const b64 = att.content ? att.content.toString('base64') : '';
                parsedAttachments.push({
                  filename: att.filename || 'anexo',
                  size: att.size || (att.content ? att.content.length : 0),
                  contentType: att.contentType || 'application/octet-stream',
                  url: b64 ? `data:${att.contentType || 'application/octet-stream'};base64,${b64}` : ''
                });
              }
            }
          } catch (parseError) {
            console.warn('[MigaduIMAP] Error parsing MIME with simpleParser:', parseError);
            cleanBody = msg.source.toString();
            cleanText = cleanBody.replace(/<[^>]+>/g, ' ').slice(0, 150);
          }
        }

        // Final safety check: if cleanBody still contains raw headers, extract the body section
        if (cleanBody.includes('Delivered-To:') || cleanBody.includes('Received:') || cleanBody.includes('Content-Type: multipart/')) {
          const parts = cleanBody.split(/\r?\n\r?\n/);
          if (parts.length > 1) {
            const contentParts = parts.filter(p => !/^(Delivered-To|Received|X-|ARC-|DKIM|Authentication|From|To|Subject|Message-ID|MIME-Version|Content-Type):/i.test(p.trim()));
            if (contentParts.length > 0) {
              cleanBody = contentParts.join('\n\n').replace(/--[a-zA-Z0-9_-]+(--)?/g, '').trim();
              cleanText = cleanBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          }
        }

        const envelope = msg.envelope;
        const fromName = cleanFromName || envelope?.from?.[0]?.name || envelope?.from?.[0]?.address?.split('@')[0] || '';
        const fromAddress = cleanFromEmail || envelope?.from?.[0]?.address || '';
        const subject = cleanSubject || envelope?.subject || '(Sem assunto)';

        messages.push({
          id: msg.uid.toString(),
          uid: msg.uid,
          from: {
            name: fromName,
            address: fromAddress
          },
          to: envelope?.to?.map(t => ({
            name: t.name || t.address || '',
            address: t.address || ''
          })) || [],
          subject: subject,
          date: envelope?.date || new Date(),
          body: cleanBody || '(Mensagem vazia)',
          textPreview: cleanText,
          isRead: msg.flags?.has('\\Seen') || false,
          starred: msg.flags?.has('\\Flagged') || false,
          folder: folder.toLowerCase(),
          attachments: parsedAttachments
        });

        count++;
        if (count >= limit) break;
      }

      await client.logout();

      // Sort newest first
      messages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return messages;
    } catch (error) {
      console.error('[MigaduIMAP] Failed to list messages for:', email, error);
      try {
        await client.logout();
      } catch {}
      return [];
    }
  }

  /**
   * Get a specific message by UID
   */
  async getMessage(
    email: string,
    password: string,
    uid: number,
    folder: string = 'INBOX'
  ): Promise<IMAPMessage | null> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      await this.openMailboxSmart(client, folder);

      let message: IMAPMessage | null = null;
      for await (const msg of client.fetch(uid.toString(), { envelope: true, source: true, flags: true, uid: true }, { uid: true })) {
        let cleanBody = '';
        let cleanText = '';
        const parsedAttachments: Array<{
          filename: string;
          size: number;
          contentType: string;
          url?: string;
        }> = [];

        let cleanSubject = '';
        let cleanFromName = '';
        let cleanFromEmail = '';

        if (msg.source) {
          try {
            const parsed = await simpleParser(msg.source);
            cleanBody = (parsed.html as string) || parsed.textAsHtml || parsed.text || '';
            cleanText = (parsed.text || '').replace(/\s+/g, ' ').trim();
            cleanSubject = parsed.subject || '';
            cleanFromName = parsed.from?.value?.[0]?.name || '';
            cleanFromEmail = parsed.from?.value?.[0]?.address || '';

            if (parsed.attachments && parsed.attachments.length > 0) {
              for (const att of parsed.attachments) {
                const b64 = att.content ? att.content.toString('base64') : '';
                parsedAttachments.push({
                  filename: att.filename || 'anexo',
                  size: att.size || (att.content ? att.content.length : 0),
                  contentType: att.contentType || 'application/octet-stream',
                  url: b64 ? `data:${att.contentType || 'application/octet-stream'};base64,${b64}` : ''
                });
              }
            }
          } catch {
            cleanBody = msg.source.toString();
            cleanText = cleanBody.replace(/<[^>]+>/g, ' ').slice(0, 150);
          }
        }

        // Final safety check: if cleanBody still contains raw headers, extract the body section
        if (cleanBody.includes('Delivered-To:') || cleanBody.includes('Received:') || cleanBody.includes('Content-Type: multipart/')) {
          const parts = cleanBody.split(/\r?\n\r?\n/);
          if (parts.length > 1) {
            const contentParts = parts.filter(p => !/^(Delivered-To|Received|X-|ARC-|DKIM|Authentication|From|To|Subject|Message-ID|MIME-Version|Content-Type):/i.test(p.trim()));
            if (contentParts.length > 0) {
              cleanBody = contentParts.join('\n\n').replace(/--[a-zA-Z0-9_-]+(--)?/g, '').trim();
              cleanText = cleanBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
          }
        }

        const envelope = msg.envelope;
        const fromName = cleanFromName || envelope?.from?.[0]?.name || envelope?.from?.[0]?.address?.split('@')[0] || '';
        const fromAddress = cleanFromEmail || envelope?.from?.[0]?.address || '';
        const subject = cleanSubject || envelope?.subject || '(Sem assunto)';

        message = {
          id: msg.uid.toString(),
          uid: msg.uid,
          from: {
            name: fromName,
            address: fromAddress
          },
          to: envelope?.to?.map(t => ({
            name: t.name || t.address || '',
            address: t.address || ''
          })) || [],
          subject: subject,
          date: envelope?.date || new Date(),
          body: cleanBody || '(Mensagem vazia)',
          textPreview: cleanText,
          isRead: msg.flags?.has('\\Seen') || false,
          starred: msg.flags?.has('\\Flagged') || false,
          folder: folder.toLowerCase(),
          attachments: parsedAttachments
        };
      }

      await client.logout();
      return message;
    } catch (error) {
      console.error('[MigaduIMAP] Failed to get message for:', email, error);
      try {
        await client.logout();
      } catch {}
      return null;
    }
  }

  /**
   * Mark a message as read/unread
   */
  async markAsRead(
    email: string,
    password: string,
    uid: number,
    isRead: boolean,
    folder: string = 'INBOX'
  ): Promise<void> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      await this.openMailboxSmart(client, folder);

      const target = await client.fetchOne(uid.toString(), { flags: true }, { uid: true });
      if (target) {
        const flags = new Set(target.flags);
        if (isRead) {
          flags.add('\\Seen');
        } else {
          flags.delete('\\Seen');
        }
        await client.messageFlagsSet(uid.toString(), Array.from(flags), { uid: true });
      }

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to mark as read for:', email, error);
      try {
        await client.logout();
      } catch {}
      throw error;
    }
  }

  /**
   * Toggle star / flagged
   */
  async toggleStar(
    email: string,
    password: string,
    uid: number,
    starred: boolean,
    folder: string = 'INBOX'
  ): Promise<void> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      await this.openMailboxSmart(client, folder);

      const target = await client.fetchOne(uid.toString(), { flags: true }, { uid: true });
      if (target) {
        const flags = new Set(target.flags);
        if (starred) {
          flags.add('\\Flagged');
        } else {
          flags.delete('\\Flagged');
        }
        await client.messageFlagsSet(uid.toString(), Array.from(flags), { uid: true });
      }

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to toggle star for:', email, error);
      try {
        await client.logout();
      } catch {}
      throw error;
    }
  }

  /**
   * Move a message to another folder
   */
  async moveMessage(
    email: string,
    password: string,
    uid: number,
    fromFolder: string,
    toFolder: string
  ): Promise<void> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      await this.openMailboxSmart(client, fromFolder);
      const destPath = await this.resolveMailboxPath(client, toFolder);
      await client.messageMove(uid.toString(), destPath, { uid: true });
      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to move message for:', email, error);
      try {
        await client.logout();
      } catch {}
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    email: string,
    password: string,
    uid: number,
    folder: string = 'INBOX'
  ): Promise<void> {
    const client = new ImapFlow({
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      auth: {
        user: email,
        pass: password
      },
      logger: false
    });

    try {
      await client.connect();
      await this.openMailboxSmart(client, folder);
      await client.messageDelete(uid.toString(), { uid: true });
      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to delete message for:', email, error);
      try {
        await client.logout();
      } catch {}
      throw error;
    }
  }

  /**
   * Send an email via SMTP and save a copy to the IMAP Sent folder
   */
  async sendEmail(options: SMTPSendOptions, password: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === 465,
      auth: {
        user: options.from,
        pass: password
      }
    });

    const customHeaders: Record<string, string> = {};
    if (options.priority === 'high') {
      customHeaders['X-Priority'] = '1 (Highest)';
      customHeaders['X-MSMail-Priority'] = 'High';
      customHeaders['Importance'] = 'High';
    } else if (options.priority === 'low') {
      customHeaders['X-Priority'] = '5 (Lowest)';
      customHeaders['X-MSMail-Priority'] = 'Low';
      customHeaders['Importance'] = 'Low';
    }

    await transporter.sendMail({
      from: options.from,
      to: options.to.join(', '),
      cc: options.cc && options.cc.length > 0 ? options.cc.join(', ') : undefined,
      bcc: options.bcc && options.bcc.length > 0 ? options.bcc.join(', ') : undefined,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
      priority: options.priority === 'high' ? 'high' : options.priority === 'low' ? 'low' : 'normal',
      headers: customHeaders
    });

    // Save a copy to Sent folder on IMAP
    try {
      const client = new ImapFlow({
        host: this.imapHost,
        port: this.imapPort,
        secure: this.imapPort === 993,
        auth: {
          user: options.from,
          pass: password
        },
        logger: false
      });

      await client.connect();
      const sentFolder = await this.resolveMailboxPath(client, 'Sent');
      
      // Build raw message buffer
      const mailGen = nodemailer.createTransport({ streamTransport: true, newline: 'windows' });
      const rawMessage = await new Promise<Buffer>((resolve, reject) => {
        mailGen.sendMail({
          from: options.from,
          to: options.to.join(', '),
          cc: options.cc && options.cc.length > 0 ? options.cc.join(', ') : undefined,
          bcc: options.bcc && options.bcc.length > 0 ? options.bcc.join(', ') : undefined,
          subject: options.subject,
          text: options.text,
          html: options.html,
          attachments: options.attachments
        }, (err, info) => {
          if (err) return reject(err);
          const chunks: Buffer[] = [];
          const stream = (info as any).message;
          if (stream && typeof stream.on === 'function') {
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
          } else {
            resolve(Buffer.from(''));
          }
        });
      });

      if (rawMessage && rawMessage.length > 0) {
        try {
          await client.append(sentFolder, rawMessage, ['\\Seen']);
        } catch {
          try {
            await client.mailboxCreate(sentFolder);
            await client.append(sentFolder, rawMessage, ['\\Seen']);
          } catch {
            try {
              await client.append('INBOX.Sent', rawMessage, ['\\Seen']);
            } catch {}
          }
        }
      }

      await client.logout();
    } catch (appendErr) {
      console.warn('[MigaduIMAP] Could not append sent message to IMAP:', appendErr);
    }
  }
}

// Singleton instance
export const migaduImapSmtp = new MigaduImapSmtpService();
