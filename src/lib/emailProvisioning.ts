// Email Provisioning Service
// This service handles the idempotent provisioning of email domains and mailboxes

import { getEmailProvider } from './emailProviders/base';
import { EmailDomain } from '../models/EmailDomain';
import { EmailMailbox } from '../models/EmailMailbox';
import { EmailAlias } from '../models/EmailAlias';
import { EmailForwarding } from '../models/EmailForwarding';
import {
  EmailProviderError,
  DomainNotFoundError,
  MailboxNotFoundError,
  DNSConfigurationError
} from './emailProviders/types';

export interface ProvisioningOptions {
  customerId: string;
  domainName: string;
  createDefaultAddresses?: boolean;
}

export interface MailboxProvisioningOptions {
  customerId: string;
  domainName: string;
  name: string;
  localPart: string;
  password?: string;
  passwordMethod?: 'generated' | 'invitation';
  passwordRecoveryEmail?: string;
}

export class EmailProvisioningService {
  private provider = getEmailProvider();

  /**
   * Idempotent domain provisioning
   * Checks if domain exists, creates if not, returns existing if it does
   */
  async provisionDomain(options: ProvisioningOptions): Promise<{
    domain: any;
    isNew: boolean;
    status: 'created' | 'existing' | 'failed';
  }> {
    const { customerId, domainName, createDefaultAddresses = false } = options;

    try {
      // Check if domain exists in our database
      const existingDomain = await EmailDomain.findOne({ domainName });
      
      if (existingDomain) {
        // Verify it still exists in the provider
        try {
          const providerDomain = await this.provider.getDomain(domainName);
          
          // Update our database with fresh data
          Object.assign(existingDomain, providerDomain);
          await existingDomain.save();
          
          return {
            domain: existingDomain,
            isNew: false,
            status: 'existing'
          };
        } catch (error) {
          if (error instanceof DomainNotFoundError) {
            // Domain exists in our DB but not in provider - recreate
            await EmailDomain.deleteOne({ domainName });
          } else {
            throw error;
          }
        }
      }

      // Create new domain
      const providerDomain = await this.provider.createDomain({
        domainName,
        createDefaultAddresses,
        hostedDns: false
      });

      // Save to our database
      const newDomain = new EmailDomain({
        ...providerDomain,
        customerId,
        id: providerDomain.id
      });
      await newDomain.save();

      return {
        domain: newDomain,
        isNew: true,
        status: 'created'
      };
    } catch (error) {
      console.error('[EmailProvisioning] Domain provisioning failed:', error);
      
      // Mark as failed if we have a record
      const domain = await EmailDomain.findOne({ domainName });
      if (domain) {
        domain.status = 'provisioning_failed';
        await domain.save();
      }

      throw new EmailProviderError(
        `Failed to provision domain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVISIONING_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Get DNS records for a domain
   */
  async getDomainDNSRecords(domainName: string): Promise<any[]> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      const records = await this.provider.getDNSRecords(domainName);
      
      // Update domain with fresh records
      domain.dnsRecords = records;
      await domain.save();

      return records;
    } catch (error) {
      console.error('[EmailProvisioning] Failed to get DNS records:', error);
      throw error;
    }
  }

  /**
   * Run DNS diagnostics for a domain
   */
  async runDNSDiagnostics(domainName: string): Promise<any> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      const diagnostics = await this.provider.runDNSDiagnostics(domainName);
      
      // Update domain with fresh diagnostics
      domain.diagnostics = diagnostics;
      
      // Update status based on diagnostics
      if (diagnostics.overall === 'passed') {
        domain.status = 'pending_dns'; // Ready to activate
      } else if (diagnostics.overall === 'failed') {
        domain.status = 'pending_dns'; // Still needs DNS configuration
      }
      
      await domain.save();

      return diagnostics;
    } catch (error) {
      console.error('[EmailProvisioning] DNS diagnostics failed:', error);
      throw error;
    }
  }

  /**
   * Activate a domain after DNS is configured
   */
  async activateDomain(domainName: string): Promise<any> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      const activatedDomain = await this.provider.activateDomain(domainName);
      
      // Update domain with activated status
      Object.assign(domain, activatedDomain);
      domain.status = 'active';
      await domain.save();

      return activatedDomain;
    } catch (error) {
      console.error('[EmailProvisioning] Domain activation failed:', error);
      
      if (error instanceof DNSConfigurationError) {
        const domain = await EmailDomain.findOne({ domainName });
        if (domain) {
          domain.status = 'pending_dns';
          await domain.save();
        }
      }

      throw error;
    }
  }

  /**
   * Idempotent mailbox provisioning
   * Checks if mailbox exists, creates if not, returns existing if it does
   */
  async provisionMailbox(options: MailboxProvisioningOptions): Promise<{
    mailbox: any;
    isNew: boolean;
    status: 'created' | 'existing' | 'failed';
  }> {
    const {
      customerId,
      domainName,
      name,
      localPart,
      password,
      passwordMethod = 'generated',
      passwordRecoveryEmail
    } = options;

    try {
      const email = `${localPart}@${domainName}`;

      // Check if mailbox exists in our database
      const existingMailbox = await EmailMailbox.findOne({ email });
      
      if (existingMailbox) {
        // Verify it still exists in the provider
        try {
          const providerMailbox = await this.provider.getMailbox(domainName, localPart);
          
          // Update our database with fresh data
          Object.assign(existingMailbox, providerMailbox);
          await existingMailbox.save();
          
          return {
            mailbox: existingMailbox,
            isNew: false,
            status: 'existing'
          };
        } catch (error) {
          if (error instanceof MailboxNotFoundError) {
            // Mailbox exists in our DB but not in provider - recreate
            await EmailMailbox.deleteOne({ email });
          } else {
            throw error;
          }
        }
      }

      // Get domain to ensure it exists
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      // Create new mailbox
      const providerMailbox = await this.provider.createMailbox(domainName, {
        name,
        localPart,
        password,
        passwordMethod,
        passwordRecoveryEmail,
        maySend: true,
        mayReceive: true,
        mayAccessImap: true,
        mayAccessPop3: false
      });

      // Save to our database
      const newMailbox = new EmailMailbox({
        ...providerMailbox,
        domainId: domain._id.toString(),
        customerId,
        email
      });
      await newMailbox.save();

      return {
        mailbox: newMailbox,
        isNew: true,
        status: 'created'
      };
    } catch (error) {
      console.error('[EmailProvisioning] Mailbox provisioning failed:', error);
      
      const email = `${localPart}@${domainName}`;
      const mailbox = await EmailMailbox.findOne({ email });
      if (mailbox) {
        mailbox.status = 'suspended';
        await mailbox.save();
      }

      throw new EmailProviderError(
        `Failed to provision mailbox: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVISIONING_FAILED',
        500,
        error
      );
    }
  }

  /**
   * Suspend a mailbox (e.g., when subscription is past due)
   */
  async suspendMailbox(domainName: string, localPart: string): Promise<any> {
    try {
      const email = `${localPart}@${domainName}`;
      const mailbox = await EmailMailbox.findOne({ email });
      
      if (!mailbox) {
        throw new MailboxNotFoundError(email);
      }

      const suspendedMailbox = await this.provider.suspendMailbox(domainName, localPart);
      
      // Update our database
      Object.assign(mailbox, suspendedMailbox);
      mailbox.status = 'suspended';
      await mailbox.save();

      return suspendedMailbox;
    } catch (error) {
      console.error('[EmailProvisioning] Mailbox suspension failed:', error);
      throw error;
    }
  }

  /**
   * Activate a suspended mailbox
   */
  async activateMailbox(domainName: string, localPart: string): Promise<any> {
    try {
      const email = `${localPart}@${domainName}`;
      const mailbox = await EmailMailbox.findOne({ email });
      
      if (!mailbox) {
        throw new MailboxNotFoundError(email);
      }

      const activatedMailbox = await this.provider.activateMailbox(domainName, localPart);
      
      // Update our database
      Object.assign(mailbox, activatedMailbox);
      mailbox.status = 'active';
      await mailbox.save();

      return activatedMailbox;
    } catch (error) {
      console.error('[EmailProvisioning] Mailbox activation failed:', error);
      throw error;
    }
  }

  /**
   * Delete a mailbox (e.g., when subscription is cancelled)
   */
  async deleteMailbox(domainName: string, localPart: string): Promise<boolean> {
    try {
      const email = `${localPart}@${domainName}`;
      const mailbox = await EmailMailbox.findOne({ email });
      
      if (!mailbox) {
        throw new MailboxNotFoundError(email);
      }

      const deleted = await this.provider.deleteMailbox(domainName, localPart);
      
      if (deleted) {
        await EmailMailbox.deleteOne({ email });
      }

      return deleted;
    } catch (error) {
      console.error('[EmailProvisioning] Mailbox deletion failed:', error);
      throw error;
    }
  }

  /**
   * Delete a domain and all its mailboxes
   */
  async deleteDomain(domainName: string): Promise<boolean> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      // First, delete all mailboxes
      const mailboxes = await EmailMailbox.find({ domainId: domain._id.toString() });
      for (const mailbox of mailboxes) {
        const emailParts = mailbox.email.split('@');
        await this.deleteMailbox(domainName, emailParts[0]);
      }

      // Then delete the domain
      const deleted = await this.provider.deleteDomain(domainName);
      
      if (deleted) {
        await EmailDomain.deleteOne({ domainName });
      }

      return deleted;
    } catch (error) {
      console.error('[EmailProvisioning] Domain deletion failed:', error);
      throw error;
    }
  }

  /**
   * Sync domain status from provider
   */
  async syncDomainStatus(domainName: string): Promise<any> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      const providerDomain = await this.provider.getDomain(domainName);
      
      // Update our database
      Object.assign(domain, providerDomain);
      await domain.save();

      return domain;
    } catch (error) {
      console.error('[EmailProvisioning] Domain sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all mailboxes for a domain
   */
  async syncDomainMailboxes(domainName: string): Promise<any[]> {
    try {
      const domain = await EmailDomain.findOne({ domainName });
      if (!domain) {
        throw new DomainNotFoundError(domainName);
      }

      const providerMailboxes = await this.provider.listMailboxes(domainName);
      
      // Sync each mailbox
      for (const providerMailbox of providerMailboxes) {
        const email = providerMailbox.email || `${providerMailbox.localPart}@${domainName}`;
        const existingMailbox = await EmailMailbox.findOne({ email });
        
        if (existingMailbox) {
          Object.assign(existingMailbox, providerMailbox);
          await existingMailbox.save();
        } else {
          const newMailbox = new EmailMailbox({
            ...providerMailbox,
            domainId: domain._id.toString(),
            customerId: domain.customerId,
            email
          });
          await newMailbox.save();
        }
      }

      return providerMailboxes;
    } catch (error) {
      console.error('[EmailProvisioning] Mailboxes sync failed:', error);
      throw error;
    }
  }
}

// Singleton instance
export const emailProvisioning = new EmailProvisioningService();
