// Migadu IMAP/SMTP Service
// This service handles real IMAP/SMTP connections to Migadu servers

import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { EmailMailbox } from '../models/EmailMailbox';

export interface IMAPMessage {
  id: string;
  uid: number;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  subject: string;
  date: Date;
  body: string;
  isRead: boolean;
  starred: boolean;
  folder: string;
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
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
   * This validates that the credentials are correct
   */
  async authenticateIMAP(email: string, password: string): Promise<boolean> {
    try {
      const mailbox = await EmailMailbox.findOne({ email });
      
      if (!mailbox) {
        return false;
      }

      if (mailbox.status !== 'active') {
        return false;
      }

      // Create IMAP connection to authenticate
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
        console.error('[MigaduIMAP] Authentication failed for:', email);
        return false;
      }
    } catch (error) {
      console.error('[MigaduIMAP] Authentication error for:', email);
      return false;
    }
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
    try {
      const authenticated = await this.authenticateIMAP(email, password);
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

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

      await client.connect();
      
      const mailbox = await client.mailboxOpen(folder);
      const messages: IMAPMessage[] = [];
      let count = 0;

      for await (const msg of client.fetch(mailbox.exists, { envelope: true, source: true })) {
        if (count >= limit) break;
        
        const envelope = msg.envelope;
        if (envelope) {
          messages.push({
            id: msg.uid.toString(),
            uid: msg.uid,
            from: {
              name: envelope.from?.[0]?.name || '',
              address: envelope.from?.[0]?.address || ''
            },
            to: envelope.to?.map(t => ({
              name: t.name || '',
              address: t.address || ''
            })) || [],
            subject: envelope.subject || '',
            date: envelope.date || new Date(),
            body: msg.source?.toString() || '',
            isRead: msg.flags?.has('\\Seen') || false,
            starred: msg.flags?.has('\\Flagged') || false,
            folder: folder.toLowerCase()
          });
          count++;
        }
      }

      await client.logout();
      return messages;
    } catch (error) {
      console.error('[MigaduIMAP] Failed to list messages for:', email);
      throw error;
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
    try {
      const authenticated = await this.authenticateIMAP(email, password);
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

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

      await client.connect();
      await client.mailboxOpen(folder);

      let message: IMAPMessage | null = null;
      for await (const msg of client.fetch(uid, { envelope: true, source: true })) {
        const envelope = msg.envelope;
        if (envelope) {
          message = {
            id: msg.uid.toString(),
            uid: msg.uid,
            from: {
              name: envelope.from?.[0]?.name || '',
              address: envelope.from?.[0]?.address || ''
            },
            to: envelope.to?.map(t => ({
              name: t.name || '',
              address: t.address || ''
            })) || [],
            subject: envelope.subject || '',
            date: envelope.date || new Date(),
            body: msg.source?.toString() || '',
            isRead: msg.flags?.has('\\Seen') || false,
            starred: msg.flags?.has('\\Flagged') || false,
            folder: folder.toLowerCase()
          };
        }
      }

      await client.logout();
      return message;
    } catch (error) {
      console.error('[MigaduIMAP] Failed to get message for:', email);
      throw error;
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
    try {
      const authenticated = await this.authenticateIMAP(email, password);
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

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

      await client.connect();
      await client.mailboxOpen(folder);

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
      console.error('[MigaduIMAP] Failed to mark as read for:', email);
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
    try {
      const authenticated = await this.authenticateIMAP(email, password);
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

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

      await client.connect();
      await client.mailboxOpen(fromFolder);

      await client.messageMove(uid, toFolder);

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to move message for:', email);
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
    try {
      const authenticated = await this.authenticateIMAP(email, password);
      if (!authenticated) {
        throw new Error('Authentication failed');
      }

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

      await client.connect();
      await client.mailboxOpen(folder);

      await client.messageDelete(uid);

      await client.logout();
    } catch (error) {
      console.error('[MigaduIMAP] Failed to delete message for:', email);
      throw error;
    }
  }

  /**
   * Send an email via SMTP
   */
  async sendEmail(options: SMTPSendOptions, password: string): Promise<void> {
    try {
      const mailbox = await EmailMailbox.findOne({ email: options.from });
      
      if (!mailbox) {
        throw new Error('Mailbox not found');
      }

      if (mailbox.status !== 'active') {
        throw new Error('Mailbox is not active');
      }

      const transporter = nodemailer.createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth: {
          user: options.from,
          pass: password
        }
      });

      await transporter.sendMail({
        from: options.from,
        to: options.to.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      });
    } catch (error) {
      console.error('[MigaduSMTP] Failed to send email from:', options.from);
      throw error;
    }
  }

  /**
   * Get IMAP connection configuration for a mailbox
   */
  getIMAPConfig(email: string): {
    host: string;
    port: number;
    secure: boolean;
    user: string;
  } {
    return {
      host: this.imapHost,
      port: this.imapPort,
      secure: this.imapPort === 993,
      user: email
    };
  }

  /**
   * Get SMTP connection configuration for a mailbox
   */
  getSMTPConfig(email: string): {
    host: string;
    port: number;
    secure: boolean;
    user: string;
  } {
    return {
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === 465,
      user: email
    };
  }
}

// Singleton instance
export const migaduImapSmtp = new MigaduImapSmtpService();
