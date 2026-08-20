// Email Provider Base Interface
// This file defines the abstract interface that all email providers must implement

import {
  EmailProviderConfig,
  EmailDomain,
  EmailMailbox,
  EmailAlias,
  EmailForwarding,
  EmailIdentity,
  DNSRecord,
  DNSDiagnostics,
  CreateDomainRequest,
  CreateMailboxRequest,
  UpdateMailboxRequest,
  EmailProviderError
} from './types';

// Re-export types for convenience
export type {
  EmailProviderConfig,
  EmailDomain,
  EmailMailbox,
  EmailAlias,
  EmailForwarding,
  EmailIdentity,
  DNSRecord,
  DNSDiagnostics,
  CreateDomainRequest,
  CreateMailboxRequest,
  UpdateMailboxRequest
} from './types';

export { EmailProviderError } from './types';

export abstract class EmailProvider {
  protected config: EmailProviderConfig;

  constructor(config: EmailProviderConfig) {
    this.config = config;
  }

  // Get provider type
  abstract getProviderType(): string;

  // Check if provider is configured
  abstract isConfigured(): boolean;

  // Domain Management
  abstract createDomain(request: CreateDomainRequest): Promise<EmailDomain>;
  abstract getDomain(domainName: string): Promise<EmailDomain>;
  abstract updateDomain(domainName: string, updates: Partial<EmailDomain>): Promise<EmailDomain>;
  abstract deleteDomain(domainName: string): Promise<boolean>;
  abstract listDomains(customerId?: string): Promise<EmailDomain[]>;
  abstract getDNSRecords(domainName: string): Promise<DNSRecord[]>;
  abstract runDNSDiagnostics(domainName: string): Promise<DNSDiagnostics>;
  abstract activateDomain(domainName: string): Promise<EmailDomain>;

  // Mailbox Management
  abstract createMailbox(domainName: string, request: CreateMailboxRequest): Promise<EmailMailbox>;
  abstract getMailbox(domainName: string, localPart: string): Promise<EmailMailbox>;
  abstract updateMailbox(domainName: string, localPart: string, request: UpdateMailboxRequest): Promise<EmailMailbox>;
  abstract deleteMailbox(domainName: string, localPart: string): Promise<boolean>;
  abstract listMailboxes(domainName: string): Promise<EmailMailbox[]>;
  abstract resetMailboxPassword(domainName: string, localPart: string, newPassword?: string): Promise<string>;
  abstract suspendMailbox(domainName: string, localPart: string): Promise<EmailMailbox>;
  abstract activateMailbox(domainName: string, localPart: string): Promise<EmailMailbox>;

  // Alias Management
  abstract createAlias(domainName: string, alias: string, destination: string): Promise<EmailAlias>;
  abstract getAlias(domainName: string, alias: string): Promise<EmailAlias>;
  abstract deleteAlias(domainName: string, alias: string): Promise<boolean>;
  abstract listAliases(domainName: string): Promise<EmailAlias[]>;

  // Forwarding Management
  abstract createForwarding(domainName: string, localPart: string, destination: string): Promise<EmailForwarding>;
  abstract getForwarding(domainName: string, localPart: string): Promise<EmailForwarding>;
  abstract deleteForwarding(domainName: string, localPart: string): Promise<boolean>;
  abstract listForwardings(domainName: string): Promise<EmailForwarding[]>;

  // Identity Management
  abstract createIdentity(mailboxId: string, email: string, name: string): Promise<EmailIdentity>;
  abstract getIdentity(mailboxId: string, identityId: string): Promise<EmailIdentity>;
  abstract deleteIdentity(mailboxId: string, identityId: string): Promise<boolean>;
  abstract listIdentities(mailboxId: string): Promise<EmailIdentity[]>;

  // Utility methods
  protected generateId(): string {
    return `${this.getProviderType()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof EmailProviderError) {
        throw error;
      }
      throw new EmailProviderError(
        `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVIDER_ERROR',
        500,
        error
      );
    }
  }

  // Helper method for idempotent operations
  protected async idempotentCreate<T>(
    checkFn: () => Promise<T | null>,
    createFn: () => Promise<T>
  ): Promise<T> {
    const existing = await checkFn();
    if (existing) {
      return existing;
    }
    return await createFn();
  }
}

// Factory function to get the appropriate provider
export function getEmailProvider(): EmailProvider {
  const providerType = process.env.EMAIL_PROVIDER || 'migadu';

  switch (providerType) {
    case 'migadu':
      const { createMigaduProvider } = require('./migadu');
      return createMigaduProvider();
    case 'google_workspace':
      // Will be implemented in googleWorkspace.ts
      throw new Error('Google Workspace provider not yet implemented');
    default:
      throw new Error(`Unknown email provider: ${providerType}`);
  }
}
