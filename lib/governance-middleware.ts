/**
 * Data Governance Middleware
 * Integrates governance policies into API routes and data operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { DataGovernancePolicy, DATA_TYPE_CLASSIFICATIONS } from '@/lib/data-governance-policy'
import { requireAuth } from '@/lib/auth-utils'
import { auditLog } from '@/lib/audit-logger'

export interface GovernanceMiddlewareOptions {
  dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS
  operation: 'read' | 'write' | 'delete'
  storageSystem?: 'firestore' | 'firebase_storage' | 'gcs' | 'secure_local_storage' | 'external_apis'
  requireOwnership?: boolean
  bypassForRoles?: string[]
}

/**
 * Middleware function to enforce data governance policies
 */
export async function withGovernance(
  handler: (request: NextRequest, context: { userId: string; userRole: string }) => Promise<NextResponse>,
  options: GovernanceMiddlewareOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // First, authenticate the user
      const authResult = await requireAuth(request)

      if (!authResult.success) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status })
      }

      const { user } = authResult
      const userId = user.uid
      const userRole = (user as any).role || 'user'

      // Check if user is bypassed for this operation
      if (options.bypassForRoles && options.bypassForRoles.includes(userRole)) {
        await auditLog('governance_bypass', {
          userId,
          userRole,
          dataType: options.dataType,
          operation: options.operation,
          reason: 'role_bypass',
          timestamp: new Date().toISOString()
        }, { userId, severity: 'medium' })

        return handler(request, { userId, userRole })
      }

      // Validate storage system if specified
      if (options.storageSystem) {
        const storageValidation = await DataGovernancePolicy.validateDataStorage(
          options.dataType,
          options.storageSystem,
          userId
        )

        if (!storageValidation.allowed) {
          await auditLog('governance_storage_violation', {
            userId,
            userRole,
            dataType: options.dataType,
            storageSystem: options.storageSystem,
            reason: storageValidation.reason,
            requirements: storageValidation.requirements,
            timestamp: new Date().toISOString()
          }, { userId, severity: 'high' })

          return NextResponse.json({
            error: 'Storage policy violation',
            details: storageValidation.reason,
            requirements: storageValidation.requirements
          }, { status: 403 })
        }
      }

      // Check data access permissions
      const accessCheck = await DataGovernancePolicy.hasDataAccess(
        userId,
        userRole,
        options.dataType,
        options.operation
      )

      if (!accessCheck.allowed) {
        await auditLog('governance_access_denied', {
          userId,
          userRole,
          dataType: options.dataType,
          operation: options.operation,
          reason: accessCheck.reason,
          timestamp: new Date().toISOString()
        }, { userId, severity: 'medium' })

        return NextResponse.json({
          error: 'Access denied',
          details: accessCheck.reason
        }, { status: 403 })
      }

      // Additional ownership check if required
      if (options.requireOwnership) {
        // This would need to be implemented per-route based on the specific resource
        // For now, we'll log it as a requirement
        await auditLog('governance_ownership_check', {
          userId,
          userRole,
          dataType: options.dataType,
          operation: options.operation,
          timestamp: new Date().toISOString()
        }, { userId, severity: 'low' })
      }

      // All governance checks passed, proceed with the handler
      return handler(request, { userId, userRole })

    } catch (error) {
      await auditLog('governance_middleware_error', {
        error: (error as Error).message,
        dataType: options.dataType,
        operation: options.operation,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })

      return NextResponse.json({
        error: 'Governance check failed',
        details: 'Internal server error'
      }, { status: 500 })
    }
  }
}

/**
 * Pre-configured governance middleware for common operations
 */
export const governanceMiddleware = {
  // Video operations
  videoUpload: (handler: any) => withGovernance(handler, {
    dataType: 'video_files',
    operation: 'write',
    storageSystem: 'gcs',
    requireOwnership: true,
    bypassForRoles: ['admin', 'superadmin']
  }),

  videoRead: (handler: any) => withGovernance(handler, {
    dataType: 'video_metadata',
    operation: 'read',
    storageSystem: 'firestore'
  }),

  // User data operations
  userProfileWrite: (handler: any) => withGovernance(handler, {
    dataType: 'user_profiles',
    operation: 'write',
    storageSystem: 'firestore',
    requireOwnership: true,
    bypassForRoles: ['admin', 'superadmin']
  }),

  // AI/Coaching operations
  aiCoaching: (handler: any) => withGovernance(handler, {
    dataType: 'ai_responses',
    operation: 'write',
    storageSystem: 'external_apis'
  }),

  // Lesson content operations
  lessonCreate: (handler: any) => withGovernance(handler, {
    dataType: 'lesson_content',
    operation: 'write',
    storageSystem: 'firestore',
    bypassForRoles: ['creator', 'coach', 'assistant', 'admin', 'superadmin']
  }),

  // Analytics operations
  analyticsRead: (handler: any) => withGovernance(handler, {
    dataType: 'analytics_data',
    operation: 'read',
    storageSystem: 'firestore',
    bypassForRoles: ['admin', 'superadmin']
  }),

  // Audit operations
  auditRead: (handler: any) => withGovernance(handler, {
    dataType: 'audit_logs',
    operation: 'read',
    storageSystem: 'firestore',
    bypassForRoles: ['admin', 'superadmin']
  })
}

/**
 * Governance validation for client-side operations
 */
export async function validateClientOperation(
  userId: string,
  userRole: string,
  dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS,
  operation: 'read' | 'write' | 'delete'
): Promise<{ allowed: boolean; reason?: string }> {

  try {
    const accessCheck = await DataGovernancePolicy.hasDataAccess(
      userId,
      userRole,
      dataType,
      operation
    )

    if (!accessCheck.allowed) {
      await auditLog('governance_client_validation_failed', {
        userId,
        userRole,
        dataType,
        operation,
        reason: accessCheck.reason,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'low' })
    }

    return accessCheck

  } catch (error) {
    await auditLog('governance_client_validation_error', {
      userId,
      userRole,
      dataType,
      operation,
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    }, { userId, severity: 'medium' })

    return {
      allowed: false,
      reason: 'Governance validation error'
    }
  }
}

/**
 * Governance utility for data retention management
 */
export class DataRetentionManager {
  /**
   * Check if data should be deleted based on retention policy
   */
  static shouldDeleteData(
    dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS,
    createdAt: Date
  ): boolean {
    const retention = DataGovernancePolicy.getRetentionPolicy(dataType)
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    return ageInDays > retention.retentionDays
  }

  /**
   * Get data that needs deletion
   */
  static async getDataForDeletion(
    dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS
  ): Promise<{ shouldDelete: boolean; shouldArchive: boolean; retentionDays: number }> {
    const retention = DataGovernancePolicy.getRetentionPolicy(dataType)

    return {
      shouldDelete: retention.autoDeleteEnabled,
      shouldArchive: retention.archiveBeforeDelete,
      retentionDays: retention.retentionDays
    }
  }

  /**
   * Schedule automatic cleanup for data type
   */
  static async scheduleCleanup(
    dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS,
    cleanupFunction: () => Promise<void>
  ): Promise<void> {
    const retention = DataGovernancePolicy.getRetentionPolicy(dataType)

    if (retention.autoDeleteEnabled) {
      // In production, this would integrate with a job scheduler
      await auditLog('governance_cleanup_scheduled', {
        dataType,
        retentionDays: retention.retentionDays,
        autoDeleteEnabled: retention.autoDeleteEnabled,
        timestamp: new Date().toISOString()
      }, { severity: 'low', source: 'data_governance' })

      // Schedule cleanup (implementation would depend on your job scheduler)
      console.log(`Scheduled cleanup for ${dataType} with ${retention.retentionDays} day retention`)
    }
  }
}