// Email Provider Types and Interfaces
// This file defines the common interfaces for all email providers

export type EmailProviderType = 'migadu' | 'google_workspace' | 'zoho' | 'custom';

export type DomainStatus = 'active' | 'pending_dns' | 'provisioning' | 'provisioning_failed' | 'suspended' | 'cancelled';

export type MailboxStatus = 'active' | 'suspended' | 'cancelled';

export type ProvisioningStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Common interfaces for all providers
export interface EmailProviderConfig {
  provider: EmailProviderType;
  apiUrl: string;
  username: string;
  apiKey: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
}

export interface EmailDomain {
  id: string;
  domainName: string;
  customerId: string;
  status: DomainStatus;
  provider: EmailProviderType;
  providerDomainId?: string;
  canSend: boolean;
  canReceive: boolean;
  activatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  dnsRecords?: DNSRecord[];
  diagnostics?: DNSDiagnostics;
}

export interface DNSRecord {
  type: 'MX' | 'SPF' | 'DKIM' | 'DMARC' | 'TXT' | 'CNAME' | 'A';
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
  status: 'correct' | 'incorrect' | 'pending' | 'missing';
}

export interface DNSDiagnostics {
  mx: { status: 'correct' | 'incorrect' | 'pending' | 'missing'; message: string };
  spf: { status: 'correct' | 'incorrect' | 'pending' | 'missing'; message: string };
  dkim: { status: 'correct' | 'incorrect' | 'pending' | 'missing'; message: string };
  dmarc: { status: 'correct' | 'incorrect' | 'pending' | 'missing'; message: string };
  overall: 'passed' | 'failed' | 'pending';
  checkedAt: Date;
}

export interface EmailMailbox {
  id: string;
  domainId: string;
  customerId: string;
  localPart: string;
  email: string;
  name: string;
  status: MailboxStatus;
  provider: EmailProviderType;
  providerMailboxId?: string;
  maySend: boolean;
  mayReceive: boolean;
  mayAccessImap: boolean;
  mayAccessPop3: boolean;
  passwordMethod?: 'generated' | 'invitation';
  passwordRecoveryEmail?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  storageUsed?: number;
  storageLimit?: number;
}

export interface EmailAlias {
  id: string;
  domainId: string;
  customerId: string;
  alias: string;
  destination: string;
  provider: EmailProviderType;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailForwarding {
  id: string;
  domainId: string;
  customerId: string;
  localPart: string;
  destination: string;
  provider: EmailProviderType;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailIdentity {
  id: string;
  mailboxId: string;
  customerId: string;
  email: string;
  name: string;
  provider: EmailProviderType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  customerId: string;
  action: string;
  resourceType: 'domain' | 'mailbox' | 'alias' | 'forwarding' | 'identity';
  resourceId: string;
  provider: EmailProviderType;
  status: 'success' | 'failed';
  details?: Record<string, any>;
  errorMessage?: string;
  createdAt: Date;
}

// Provider-specific request/response types
export interface CreateDomainRequest {
  domainName: string;
  createDefaultAddresses?: boolean;
  hostedDns?: boolean;
}

export interface CreateMailboxRequest {
  name: string;
  localPart: string;
  password?: string;
  passwordMethod?: 'generated' | 'invitation';
  passwordRecoveryEmail?: string;
  maySend?: boolean;
  mayReceive?: boolean;
  mayAccessImap?: boolean;
  mayAccessPop3?: boolean;
}

export interface UpdateMailboxRequest {
  name?: string;
  password?: string;
  maySend?: boolean;
  mayReceive?: boolean;
  mayAccessImap?: boolean;
  mayAccessPop3?: boolean;
}

// Error types
export class EmailProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'EmailProviderError';
  }
}

export class DomainNotFoundError extends EmailProviderError {
  constructor(domain: string) {
    super(`Domain ${domain} not found`, 'DOMAIN_NOT_FOUND', 404);
  }
}

export class MailboxNotFoundError extends EmailProviderError {
  constructor(email: string) {
    super(`Mailbox ${email} not found`, 'MAILBOX_NOT_FOUND', 404);
  }
}

export class DNSConfigurationError extends EmailProviderError {
  constructor(message: string) {
    super(message, 'DNS_CONFIGURATION_ERROR', 422);
  }
}

export class AuthenticationError extends EmailProviderError {
  constructor() {
    super('Authentication failed', 'AUTHENTICATION_ERROR', 401);
  }
}

export class RateLimitError extends EmailProviderError {
  constructor() {
    super('Rate limit exceeded', 'RATE_LIMIT_ERROR', 429);
  }
}

export class ProviderUnavailableError extends EmailProviderError {
  constructor() {
    super('Email provider temporarily unavailable', 'PROVIDER_UNAVAILABLE', 503);
  }
}
