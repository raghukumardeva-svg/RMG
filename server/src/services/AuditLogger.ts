/**
 * Audit Logging Service
 * Centralized logging for sensitive operations across the application
 * Provides structured audit trails for security, compliance, and debugging
 */

import mongoose from 'mongoose';

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  // Event identification
  eventId: {
    type: String,
    required: true,
    unique: true,
    default: () => `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'AUTH_LOGIN_SUCCESS',
      'AUTH_LOGIN_FAILURE',
      'AUTH_LOGOUT',
      'AUTH_PASSWORD_CHANGE',
      'AUTH_PASSWORD_RESET',
      'AUTH_TOKEN_REFRESH',
      'AUTH_SESSION_EXPIRED',

      // User management
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
      'USER_STATUS_CHANGED',
      'USER_ACCESS_GRANTED',
      'USER_ACCESS_REVOKED',

      // Helpdesk events
      'TICKET_CREATED',
      'TICKET_UPDATED',
      'TICKET_APPROVED',
      'TICKET_REJECTED',
      'TICKET_ASSIGNED',
      'TICKET_ESCALATED',
      'TICKET_RESOLVED',
      'TICKET_CLOSED',
      'TICKET_CANCELLED',
      'TICKET_DELETED',

      // Data access events
      'DATA_EXPORT',
      'DATA_IMPORT',
      'REPORT_GENERATED',
      'SENSITIVE_DATA_ACCESS',

      // Admin operations
      'ADMIN_CONFIG_CHANGE',
      'ADMIN_SYSTEM_SETTING',
      'ADMIN_BULK_OPERATION',

      // Security events
      'SECURITY_RATE_LIMIT_HIT',
      'SECURITY_INVALID_TOKEN',
      'SECURITY_UNAUTHORIZED_ACCESS',
      'SECURITY_SUSPICIOUS_ACTIVITY',

      // File operations
      'FILE_UPLOADED',
      'FILE_DOWNLOADED',
      'FILE_DELETED',

      // Generic
      'OTHER'
    ]
  },

  // Actor information (who performed the action)
  actor: {
    userId: String,
    userName: String,
    userEmail: String,
    userRole: String,
    ipAddress: String,
    userAgent: String,
    sessionId: String,
  },

  // Target information (what was affected)
  target: {
    entityType: String, // 'User', 'Ticket', 'Employee', etc.
    entityId: String,
    entityName: String,
  },

  // Event details
  action: {
    type: String,
    required: true
  },
  description: String,

  // Change tracking
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Request context
  request: {
    method: String,
    path: String,
    query: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed, // Sanitized - no passwords/tokens
  },

  // Response context
  response: {
    statusCode: Number,
    success: Boolean,
    errorMessage: String,
  },

  // Classification
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  category: {
    type: String,
    enum: ['SECURITY', 'AUTHENTICATION', 'DATA', 'ADMIN', 'USER_ACTION', 'SYSTEM'],
    default: 'USER_ACTION'
  },

  // Timestamps
  timestamp: {
    type: Date,
    default: Date.now
    // Note: index removed - timestamp is indexed via compound indexes below
  },
}, {
  timestamps: true,
  strict: true
});

// Indexes for efficient querying
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ 'target.entityType': 1, 'target.entityId': 1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ category: 1, timestamp: -1 });

// TTL index to auto-delete old logs (keep for 1 year)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Document type for query results (using Record for compatibility with lean())
export interface AuditLogDocument {
  eventId: string;
  eventType: string;
  actor?: AuditActor | null;
  target?: AuditTarget | null;
  action: string;
  description?: string | null;
  changes?: AuditChanges | null;
  metadata?: Record<string, unknown> | null;
  request?: AuditRequest | null;
  response?: AuditResponse | null;
  severity: AuditSeverity;
  category: AuditCategory;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: unknown; // Allow additional mongoose properties
}

// Types
export interface AuditActor {
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionId?: string | null;
}

export interface AuditTarget {
  entityType?: string | null;
  entityId?: string | null;
  entityName?: string | null;
}

export interface AuditChanges {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface AuditRequest {
  method?: string | null;
  path?: string | null;
  query?: Record<string, unknown> | null;
  body?: Record<string, unknown> | null;
}

export interface AuditResponse {
  statusCode?: number | null;
  success?: boolean | null;
  errorMessage?: string | null;
}

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditCategory = 'SECURITY' | 'AUTHENTICATION' | 'DATA' | 'ADMIN' | 'USER_ACTION' | 'SYSTEM';

export interface AuditLogEntry {
  eventType: string;
  action: string;
  description?: string;
  actor?: AuditActor;
  target?: AuditTarget;
  changes?: AuditChanges;
  metadata?: Record<string, unknown>;
  request?: AuditRequest;
  response?: AuditResponse;
  severity?: AuditSeverity;
  category?: AuditCategory;
}

/**
 * Audit Logger Service
 */
class AuditLoggerService {
  /**
   * Sanitize request body by removing sensitive fields
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    if (!body) return {};

    const sensitiveFields = [
      'password', 'newPassword', 'currentPassword', 'oldPassword',
      'token', 'accessToken', 'refreshToken', 'apiKey', 'secret',
      'creditCard', 'cardNumber', 'cvv', 'ssn', 'socialSecurity'
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Create an audit log entry
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Sanitize request body if present
      const sanitizedEntry = {
        ...entry,
        request: entry.request ? {
          ...entry.request,
          body: entry.request.body ? this.sanitizeBody(entry.request.body) : undefined
        } : undefined
      };

      await AuditLog.create(sanitizedEntry);
    } catch (error) {
      // Don't throw - logging should never break the application
      console.error('[AuditLogger] Failed to create audit log:', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    eventType: 'AUTH_LOGIN_SUCCESS' | 'AUTH_LOGIN_FAILURE' | 'AUTH_LOGOUT' | 'AUTH_PASSWORD_CHANGE' | 'AUTH_PASSWORD_RESET',
    actor: AuditActor,
    success: boolean,
    errorMessage?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType,
      action: eventType.replace('AUTH_', '').replace(/_/g, ' '),
      actor,
      response: { success, errorMessage },
      severity: success ? 'LOW' : (eventType === 'AUTH_LOGIN_FAILURE' ? 'MEDIUM' : 'HIGH'),
      category: 'AUTHENTICATION',
      metadata
    });
  }

  /**
   * Log user management event
   */
  async logUserEvent(
    eventType: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'USER_ROLE_CHANGED' | 'USER_STATUS_CHANGED' | 'USER_ACCESS_GRANTED' | 'USER_ACCESS_REVOKED',
    actor: AuditActor,
    target: AuditTarget,
    changes?: AuditChanges,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const severity = eventType === 'USER_ROLE_CHANGED' || eventType === 'USER_DELETED' ? 'HIGH' : 'MEDIUM';

    await this.log({
      eventType,
      action: eventType.replace('USER_', '').replace(/_/g, ' '),
      actor,
      target,
      changes,
      severity,
      category: 'ADMIN',
      metadata
    });
  }

  /**
   * Log ticket event
   */
  async logTicketEvent(
    eventType: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_APPROVED' | 'TICKET_REJECTED' | 'TICKET_ASSIGNED' | 'TICKET_ESCALATED' | 'TICKET_RESOLVED' | 'TICKET_CLOSED' | 'TICKET_CANCELLED' | 'TICKET_DELETED',
    actor: AuditActor,
    ticketId: string,
    ticketNumber: string,
    changes?: AuditChanges,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType,
      action: eventType.replace('TICKET_', '').replace(/_/g, ' '),
      actor,
      target: {
        entityType: 'Ticket',
        entityId: ticketId,
        entityName: ticketNumber
      },
      changes,
      severity: eventType === 'TICKET_DELETED' ? 'HIGH' : 'LOW',
      category: 'USER_ACTION',
      metadata
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: 'SECURITY_RATE_LIMIT_HIT' | 'SECURITY_INVALID_TOKEN' | 'SECURITY_UNAUTHORIZED_ACCESS' | 'SECURITY_SUSPICIOUS_ACTIVITY',
    actor: AuditActor,
    description: string,
    request?: AuditRequest,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType,
      action: eventType.replace('SECURITY_', '').replace(/_/g, ' '),
      description,
      actor,
      request,
      severity: eventType === 'SECURITY_SUSPICIOUS_ACTIVITY' ? 'CRITICAL' : 'HIGH',
      category: 'SECURITY',
      metadata
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    eventType: 'DATA_EXPORT' | 'DATA_IMPORT' | 'REPORT_GENERATED' | 'SENSITIVE_DATA_ACCESS',
    actor: AuditActor,
    description: string,
    target?: AuditTarget,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      eventType,
      action: eventType.replace('DATA_', '').replace(/_/g, ' '),
      description,
      actor,
      target,
      severity: eventType === 'SENSITIVE_DATA_ACCESS' ? 'HIGH' : 'MEDIUM',
      category: 'DATA',
      metadata
    });
  }

  /**
   * Query audit logs
   */
  async query(filters: {
    eventType?: string;
    actorUserId?: string;
    targetEntityType?: string;
    targetEntityId?: string;
    severity?: AuditSeverity;
    category?: AuditCategory;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }): Promise<{ logs: AuditLogDocument[]; total: number }> {
    const query: Record<string, unknown> = {};

    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.actorUserId) query['actor.userId'] = filters.actorUserId;
    if (filters.targetEntityType) query['target.entityType'] = filters.targetEntityType;
    if (filters.targetEntityId) query['target.entityId'] = filters.targetEntityId;
    if (filters.severity) query.severity = filters.severity;
    if (filters.category) query.category = filters.category;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) (query.timestamp as Record<string, unknown>).$gte = filters.startDate;
      if (filters.endDate) (query.timestamp as Record<string, unknown>).$lte = filters.endDate;
    }

    const limit = filters.limit || 100;
    const skip = filters.skip || 0;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ timestamp: -1 }).limit(limit).skip(skip).lean(),
      AuditLog.countDocuments(query)
    ]);

    return { logs, total };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityHistory(entityType: string, entityId: string): Promise<AuditLogDocument[]> {
    return AuditLog.find({
      'target.entityType': entityType,
      'target.entityId': entityId
    }).sort({ timestamp: -1 }).lean();
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId: string, limit = 100): Promise<AuditLogDocument[]> {
    return AuditLog.find({
      'actor.userId': userId
    }).sort({ timestamp: -1 }).limit(limit).lean();
  }
}

// Export singleton instance
export const auditLogger = new AuditLoggerService();

export default auditLogger;
