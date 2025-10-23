import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export type AuditCategory = 'AUTH' | 'ACCESS' | 'DATA' | 'CONFIG' | 'VERIFICATION' | 'SYSTEM';
export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';

export interface CreateAuditLogParams {
  userId: number;
  action: string;
  category: AuditCategory;
  status?: AuditStatus;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  hashPointer?: string;
}

/**
 * Create an audit log entry with automatic Lamport clock increment
 */
export async function createAuditLog({
  userId,
  action,
  category,
  status = 'INFO',
  details = {},
  metadata = {},
  hashPointer,
}: CreateAuditLogParams) {
  try {
    // Get and increment Lamport clock
    let lamportState = await prisma.lamportState.findUnique({
      where: { key: 'global_lamport' },
    });

    if (!lamportState) {
      lamportState = await prisma.lamportState.create({
        data: {
          key: 'global_lamport',
          value: '0',
          lamport: 0,
        },
      });
    }

    const newLamport = lamportState.lamport + 1;

    // Add timestamp and IP to metadata
    const enrichedMetadata = {
      ...metadata,
      timestamp: new Date().toISOString(),
      lamportClock: newLamport,
    };

    // Create audit log
    const auditLog = await prisma.auditRecord.create({
      data: {
        userId,
        action,
        category,
        status,
        details: details || {},
        metadata: enrichedMetadata,
        lamport: newLamport,
        hashPointer: hashPointer || null,
      },
    });

    // Update Lamport clock
    await prisma.lamportState.update({
      where: { key: 'global_lamport' },
      data: {
        lamport: newLamport,
        value: newLamport.toString(),
      },
    });

    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit logging should not break the main operation
    return null;
  }
}

/**
 * Convenience functions for common audit actions
 */

export async function auditAuth(
  userId: number,
  action: string,
  success: boolean,
  details?: Record<string, any>
) {
  return createAuditLog({
    userId,
    action,
    category: 'AUTH',
    status: success ? 'SUCCESS' : 'FAILURE',
    details,
  });
}

export async function auditAccess(
  userId: number,
  resource: string,
  action: 'view' | 'create' | 'update' | 'delete',
  granted: boolean,
  details?: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: `${action.toUpperCase()} ${resource}`,
    category: 'ACCESS',
    status: granted ? 'SUCCESS' : 'FAILURE',
    details: {
      ...details,
      resource,
      action,
      granted,
    },
  });
}

export async function auditData(
  userId: number,
  entity: string,
  operation: 'create' | 'update' | 'delete',
  entityId?: number | string,
  changes?: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: `${operation.toUpperCase()} ${entity}`,
    category: 'DATA',
    status: 'SUCCESS',
    details: {
      entity,
      operation,
      entityId,
      changes,
    },
  });
}

export async function auditConfig(
  userId: number,
  setting: string,
  oldValue?: any,
  newValue?: any
) {
  return createAuditLog({
    userId,
    action: `UPDATE CONFIG: ${setting}`,
    category: 'CONFIG',
    status: 'SUCCESS',
    details: {
      setting,
      oldValue,
      newValue,
    },
  });
}

export async function auditVerification(
  userId: number,
  action: string,
  verified: boolean,
  details?: Record<string, any>
) {
  return createAuditLog({
    userId,
    action,
    category: 'VERIFICATION',
    status: verified ? 'SUCCESS' : 'FAILURE',
    details,
  });
}

export async function auditSystem(
  userId: number,
  event: string,
  severity: 'INFO' | 'WARNING' | 'FAILURE',
  details?: Record<string, any>
) {
  return createAuditLog({
    userId,
    action: `SYSTEM: ${event}`,
    category: 'SYSTEM',
    status: severity,
    details,
  });
}

/**
 * Get audit logs for a specific user with filtering
 */
export async function getUserAuditLogs(
  userId: number,
  options: {
    category?: AuditCategory;
    status?: AuditStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { userId };

  if (options.category) {
    where.category = options.category;
  }

  if (options.status) {
    where.status = options.status;
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    prisma.auditRecord.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Verify audit trail integrity using Lamport clocks
 */
export async function verifyAuditTrail(userId: number): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const logs = await prisma.auditRecord.findMany({
    where: { userId },
    orderBy: { lamport: 'asc' },
  });

  const errors: string[] = [];
  let previousLamport = 0;

  for (const log of logs) {
    if (log.lamport <= previousLamport) {
      errors.push(
        `Invalid Lamport clock sequence at log ${log.id}: ${log.lamport} <= ${previousLamport}`
      );
    }
    previousLamport = log.lamport;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
