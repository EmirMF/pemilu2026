import prisma from '@/lib/prisma'
import { headers } from 'next/headers'

export type AuditAction =
  | 'VOTE'
  | 'VOTE_ATTEMPT_FAILED'
  | 'LOGIN_SSO_SUCCESS'
  | 'LOGIN_SSO_REJECTED'
  | 'LOGIN_FAILED'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'SETTINGS_ELECTION_CHANGED'
  | 'SETTINGS_GRADIENT_CHANGED'
  | 'RESULTS_PUBLISHED'
  | 'RESULTS_UNPUBLISHED'
  | 'RESET_ELECTION'
  | 'CANDIDATE_CREATED'
  | 'CANDIDATE_UPDATED'
  | 'CANDIDATE_DELETED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'WHITELIST_ADDED'
  | 'WHITELIST_REMOVED'
  | 'BULK_IMPORT_DPT'
  | 'PASSWORD_SET'
  | 'PASSWORD_CHANGED'

export type AuditStatus = 'SUCCESS' | 'FAILED' | 'BLOCKED'

export type AuditRole = 'VOTER' | 'ADMIN' | 'SYSTEM'

export interface AuditLogData {
  action: AuditAction
  actorNim?: string
  actorEmail?: string
  actorRole?: AuditRole
  targetId?: string
  targetType?: string
  details?: string | Record<string, any>
  status: AuditStatus
  errorMsg?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Get request headers for IP and User Agent
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.auditLog.create({
      data: {
        action: data.action,
        actorNim: data.actorNim,
        actorEmail: data.actorEmail,
        actorRole: data.actorRole,
        targetId: data.targetId,
        targetType: data.targetType,
        details: typeof data.details === 'string' ? data.details : (data.details ? JSON.stringify(data.details) : null),
        ipAddress,
        userAgent,
        status: data.status,
        errorMsg: data.errorMsg,
      },
    })
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Get audit logs with filtering and pagination
 */
export async function getAuditLogs(options: {
  action?: AuditAction
  actorNim?: string
  status?: AuditStatus
  startDate?: Date
  endDate?: Date
  limit?: number
  skip?: number
}) {
  const where: any = {}

  if (options.action) where.action = options.action
  if (options.actorNim) where.actorNim = options.actorNim
  if (options.status) where.status = options.status
  
  if (options.startDate || options.endDate) {
    where.createdAt = {}
    if (options.startDate) where.createdAt.gte = options.startDate
    if (options.endDate) where.createdAt.lte = options.endDate
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.skip || 0,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    logs: logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    })),
    total,
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStats(startDate?: Date, endDate?: Date) {
  const where: any = {}
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [totalLogs, successCount, failedCount, blockedCount, actionCounts] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, status: 'SUCCESS' } }),
    prisma.auditLog.count({ where: { ...where, status: 'FAILED' } }),
    prisma.auditLog.count({ where: { ...where, status: 'BLOCKED' } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),
  ])

  return {
    totalLogs,
    successCount,
    failedCount,
    blockedCount,
    actionCounts: actionCounts.map(item => ({
      action: item.action,
      count: item._count,
    })),
  }
}
