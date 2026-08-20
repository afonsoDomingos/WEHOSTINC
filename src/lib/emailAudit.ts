// Email Audit Logging Service
// This service handles audit logging for all email provider operations

import { EmailAuditLog } from '../models/EmailAuditLog';

export interface AuditLogOptions {
  customerId: string;
  action: string;
  resourceType: 'domain' | 'mailbox' | 'alias' | 'forwarding' | 'identity';
  resourceId: string;
  provider: string;
  status: 'success' | 'failed';
  details?: Record<string, any>;
  errorMessage?: string;
}

export class EmailAuditService {
  /**
   * Log an audit event
   */
  async log(options: AuditLogOptions): Promise<void> {
    try {
      const {
        customerId,
        action,
        resourceType,
        resourceId,
        provider,
        status,
        details,
        errorMessage
      } = options;

      // Sanitize details to remove sensitive information
      const sanitizedDetails = this.sanitizeDetails(details);

      const log = new EmailAuditLog({
        customerId,
        action,
        resourceType,
        resourceId,
        provider,
        status,
        details: sanitizedDetails,
        errorMessage: errorMessage || undefined
      });

      await log.save();
    } catch (error) {
      console.error('[EmailAudit] Failed to log audit event:', error);
      // Don't throw - audit logging failures shouldn't break the main operation
    }
  }

  /**
   * Get audit logs for a customer
   */
  async getCustomerLogs(
    customerId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const logs = await EmailAuditLog
        .find({ customerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);

      return logs;
    } catch (error) {
      console.error('[EmailAudit] Failed to get customer logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getResourceLogs(
    resourceId: string,
    resourceType?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const query: any = { resourceId };
      if (resourceType) {
        query.resourceType = resourceType;
      }

      const logs = await EmailAuditLog
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[EmailAudit] Failed to get resource logs:', error);
      throw error;
    }
  }

  /**
   * Get failed logs for troubleshooting
   */
  async getFailedLogs(
    customerId?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const query: any = { status: 'failed' };
      if (customerId) {
        query.customerId = customerId;
      }

      const logs = await EmailAuditLog
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[EmailAudit] Failed to get failed logs:', error);
      throw error;
    }
  }

  /**
   * Get logs by action type
   */
  async getLogsByAction(
    action: string,
    customerId?: string,
    limit: number = 100
  ): Promise<any[]> {
    try {
      const query: any = { action };
      if (customerId) {
        query.customerId = customerId;
      }

      const logs = await EmailAuditLog
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return logs;
    } catch (error) {
      console.error('[EmailAudit] Failed to get logs by action:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(customerId?: string): Promise<{
    total: number;
    success: number;
    failed: number;
    byResourceType: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    try {
      const matchQuery: any = {};
      if (customerId) {
        matchQuery.customerId = customerId;
      }

      const stats = await EmailAuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            byResourceType: {
              $push: '$resourceType'
            },
            byAction: {
              $push: '$action'
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        success: 0,
        failed: 0,
        byResourceType: [],
        byAction: []
      };

      // Count occurrences
      const countByResourceType = this.countOccurrences(result.byResourceType);
      const countByAction = this.countOccurrences(result.byAction);

      return {
        total: result.total,
        success: result.success,
        failed: result.failed,
        byResourceType: countByResourceType,
        byAction: countByAction
      };
    } catch (error) {
      console.error('[EmailAudit] Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * Delete old logs (cleanup)
   */
  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await EmailAuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('[EmailAudit] Failed to delete old logs:', error);
      throw error;
    }
  }

  /**
   * Sanitize details to remove sensitive information
   */
  private sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
    if (!details) {
      return undefined;
    }

    const sensitiveKeys = [
      'password',
      'apiKey',
      'api_key',
      'secret',
      'token',
      'credential',
      'auth'
    ];

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeDetails(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Count occurrences in an array
   */
  private countOccurrences(arr: string[]): Record<string, number> {
    return arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Singleton instance
export const emailAudit = new EmailAuditService();
