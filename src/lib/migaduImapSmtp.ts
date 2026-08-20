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
  subject: string;
  text?: string;
  html?: string;
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
   * Open mailbox with smart folder name resolution
   */
  private async openMailboxSmart(client: ImapFlow, folder: string) {
    const target = folder.toUpperCase();
    const candidateFolders = [folder];

    if (target === 'SENT' || target === 'ENVIADOS') {
      candidateFolders.push('Sent', 'Sent Messages', 'INBOX.Sent', 'Sent Items');
    } else if (target === 'TRASH' || target === 'LIXEIRA') {
      candidateFolders.push('Trash', 'Deleted Messages', 'INBOX.Trash', 'Deleted Items');
    } else if (target === 'DRAFTS' || target === 'RASCUNHOS') {
      candidateFolders.push('Drafts', 'INBOX.Drafts');
    } else if (target === 'JUNK' || target === 'SPAM') {
      candidateFolders.push('Junk', 'Spam', 'INBOX.Junk');
    } else {
      candidateFolders.push('INBOX');
    }

    for (const f of candidateFolders) {
      try {
        const mb = await client.mailboxOpen(f);
        if (mb) return mb;
      } catch {
        // Try next candidate
      }
    }

    // Fallback to INBOX
    return await client.mailboxOpen('INBOX');
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
      for await (const msg of client.fetch(uid, { envelope: true, source: true, flags: true, uid: true })) {
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

      const target = await client.fetchOne(uid, { flags: true });
      if (target) {
        const flags = new Set(target.flags);
        if (isRead) {
          flags.add('\\Seen');
        } else {
          flags.delete('\\Seen');
        }
        await client.messageFlagsSet(uid, Array.from(flags));
      }

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to mark as read for:', email, error);
      try {
        await client.logout();
      } catch {}
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

      const target = await client.fetchOne(uid, { flags: true });
      if (target) {
        const flags = new Set(target.flags);
        if (starred) {
          flags.add('\\Flagged');
        } else {
          flags.delete('\\Flagged');
        }
        await client.messageFlagsSet(uid, Array.from(flags));
      }

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to toggle star for:', email, error);
      try {
        await client.logout();
      } catch {}
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
      await client.messageMove(uid, toFolder);
      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to move message for:', email, error);
      try {
        await client.logout();
      } catch {}
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
      await client.messageDelete(uid);
      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to delete message for:', email, error);
      try {
        await client.logout();
      } catch {}
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

    const info = await transporter.sendMail({
      from: options.from,
      to: options.to.join(', '),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments
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
      const sentFolder = 'Sent';
      
      // Build raw message buffer
      const mailGen = nodemailer.createTransport({ streamTransport: true, newline: 'windows' });
      mailGen.sendMail({
        from: options.from,
        to: options.to.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      }, async (err, result) => {
        if (!err && result && result.message) {
          try {
            await client.append(sentFolder, result.message as any, ['\\Seen']);
          } catch {
            try {
              await client.append('INBOX.Sent', result.message as any, ['\\Seen']);
            } catch {}
          }
        }
        try {
          await client.logout();
        } catch {}
      });
    } catch {
      // Append warning ignored - email was sent via SMTP successfully
    }
  }
}

// Singleton instance
export const migaduImapSmtp = new MigaduImapSmtpService();
