/**
 * Unified Data Governance Policy
 * Comprehensive security and compliance framework across all storage systems
 */

import { auditLog } from '@/lib/audit-logger'

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted'
  description: string
  retentionDays: number
  encryptionRequired: boolean
  auditRequired: boolean
  accessControls: string[]
}

export interface StorageSystem {
  name: string
  type: 'firebase_firestore' | 'firebase_storage' | 'gcs' | 'local_storage' | 'external_api'
  securityLevel: 'basic' | 'enhanced' | 'enterprise'
  encryption: 'none' | 'in_transit' | 'at_rest' | 'end_to_end'
  auditLogging: boolean
  dataClassifications: DataClassification['level'][]
}

/**
 * Data Classification Levels
 */
export const DATA_CLASSIFICATIONS: Record<string, DataClassification> = {
  public: {
    level: 'public',
    description: 'Information that can be freely shared without restriction',
    retentionDays: 365 * 5, // 5 years
    encryptionRequired: false,
    auditRequired: false,
    accessControls: ['public_read']
  },
  internal: {
    level: 'internal',
    description: 'Information for authenticated users within the platform',
    retentionDays: 365 * 3, // 3 years
    encryptionRequired: true,
    auditRequired: true,
    accessControls: ['authenticated_read', 'role_based']
  },
  confidential: {
    level: 'confidential',
    description: 'Sensitive information requiring role-based access control',
    retentionDays: 365 * 2, // 2 years
    encryptionRequired: true,
    auditRequired: true,
    accessControls: ['role_based', 'owner_only', 'admin_override']
  },
  restricted: {
    level: 'restricted',
    description: 'Highly sensitive information with strict access controls',
    retentionDays: 365, // 1 year
    encryptionRequired: true,
    auditRequired: true,
    accessControls: ['owner_only', 'admin_approval', 'time_limited']
  }
}

/**
 * Storage Systems Configuration
 */
export const STORAGE_SYSTEMS: Record<string, StorageSystem> = {
  firestore: {
    name: 'Firestore Database',
    type: 'firebase_firestore',
    securityLevel: 'enterprise',
    encryption: 'at_rest',
    auditLogging: true,
    dataClassifications: ['public', 'internal', 'confidential', 'restricted']
  },
  firebase_storage: {
    name: 'Firebase Storage',
    type: 'firebase_storage',
    securityLevel: 'enterprise',
    encryption: 'at_rest',
    auditLogging: true,
    dataClassifications: ['public', 'internal', 'confidential']
  },
  gcs: {
    name: 'Google Cloud Storage',
    type: 'gcs',
    securityLevel: 'enterprise',
    encryption: 'at_rest',
    auditLogging: true,
    dataClassifications: ['internal', 'confidential']
  },
  secure_local_storage: {
    name: 'Encrypted Local Storage',
    type: 'local_storage',
    securityLevel: 'enhanced',
    encryption: 'end_to_end',
    auditLogging: true,
    dataClassifications: ['internal', 'confidential']
  },
  external_apis: {
    name: 'External API Services',
    type: 'external_api',
    securityLevel: 'basic',
    encryption: 'in_transit',
    auditLogging: true,
    dataClassifications: ['internal']
  }
}

/**
 * Data Type Classifications
 */
export const DATA_TYPE_CLASSIFICATIONS = {
  // User Data
  'user_profiles': 'internal',
  'user_credentials': 'restricted',
  'user_preferences': 'internal',
  'user_activity_logs': 'confidential',

  // Content Data
  'video_files': 'confidential',
  'video_metadata': 'internal',
  'lesson_content': 'internal',
  'creator_profiles': 'public',

  // System Data
  'audit_logs': 'restricted',
  'system_configurations': 'restricted',
  'api_keys': 'restricted',
  'upload_tokens': 'confidential',

  // AI/ML Data
  'ai_responses': 'internal',
  'coaching_sessions': 'confidential',
  'personalization_data': 'confidential',

  // Business Data
  'analytics_data': 'confidential',
  'usage_metrics': 'internal',
  'performance_data': 'internal'
} as const

/**
 * Data Governance Policy Engine
 */
export class DataGovernancePolicy {
  /**
   * Validate data storage according to governance policy
   */
  static async validateDataStorage(
    dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS,
    storageSystem: keyof typeof STORAGE_SYSTEMS,
    userId?: string
  ): Promise<{ allowed: boolean; reason?: string; requirements?: string[] }> {

    const classification = DATA_TYPE_CLASSIFICATIONS[dataType]
    const storage = STORAGE_SYSTEMS[storageSystem]
    const dataClass = DATA_CLASSIFICATIONS[classification]

    if (!dataClass) {
      await auditLog('data_governance_unknown_classification', {
        dataType,
        storageSystem,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'high' })

      return {
        allowed: false,
        reason: `Unknown data classification for type: ${dataType}`
      }
    }

    if (!storage) {
      await auditLog('data_governance_unknown_storage', {
        dataType,
        storageSystem,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'high' })

      return {
        allowed: false,
        reason: `Unknown storage system: ${storageSystem}`
      }
    }

    // Check if storage system supports this data classification
    if (!storage.dataClassifications.includes(dataClass.level)) {
      await auditLog('data_governance_classification_mismatch', {
        dataType,
        classification: dataClass.level,
        storageSystem,
        supportedClassifications: storage.dataClassifications,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'high' })

      return {
        allowed: false,
        reason: `Storage system ${storageSystem} does not support ${dataClass.level} data classification`,
        requirements: [`Use storage system that supports ${dataClass.level} data`]
      }
    }

    // Check encryption requirements
    if (dataClass.encryptionRequired && storage.encryption === 'none') {
      return {
        allowed: false,
        reason: `Data type ${dataType} requires encryption but storage system has none`,
        requirements: ['Enable encryption for this storage system']
      }
    }

    // Check audit requirements
    if (dataClass.auditRequired && !storage.auditLogging) {
      return {
        allowed: false,
        reason: `Data type ${dataType} requires audit logging but storage system has none`,
        requirements: ['Enable audit logging for this storage system']
      }
    }

    await auditLog('data_governance_validation_success', {
      dataType,
      classification: dataClass.level,
      storageSystem,
      timestamp: new Date().toISOString()
    }, { userId, severity: 'low' })

    return { allowed: true }
  }

  /**
   * Get retention policy for data type
   */
  static getRetentionPolicy(dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS): {
    retentionDays: number
    autoDeleteEnabled: boolean
    archiveBeforeDelete: boolean
  } {
    const classification = DATA_TYPE_CLASSIFICATIONS[dataType]
    const dataClass = DATA_CLASSIFICATIONS[classification]

    return {
      retentionDays: dataClass.retentionDays,
      autoDeleteEnabled: dataClass.level === 'restricted',
      archiveBeforeDelete: ['confidential', 'restricted'].includes(dataClass.level)
    }
  }

  /**
   * Get required access controls for data type
   */
  static getAccessControls(dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS): string[] {
    const classification = DATA_TYPE_CLASSIFICATIONS[dataType]
    const dataClass = DATA_CLASSIFICATIONS[classification]
    return dataClass.accessControls
  }

  /**
   * Check if user has permission to access data type
   */
  static async hasDataAccess(
    userId: string,
    userRole: string,
    dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS,
    operation: 'read' | 'write' | 'delete',
    resourceOwnerId?: string
  ): Promise<{ allowed: boolean; reason?: string }> {

    const classification = DATA_TYPE_CLASSIFICATIONS[dataType]
    const dataClass = DATA_CLASSIFICATIONS[classification]
    const accessControls = dataClass.accessControls

    // Public data - always readable
    if (dataClass.level === 'public' && operation === 'read') {
      return { allowed: true }
    }

    // Owner access (if resource has an owner)
    if (resourceOwnerId && userId === resourceOwnerId && accessControls.includes('owner_only')) {
      return { allowed: true }
    }

    // Role-based access
    if (accessControls.includes('role_based')) {
      const roleHierarchy = ['guest', 'user', 'creator', 'coach', 'assistant', 'admin', 'superadmin']
      const userRoleIndex = roleHierarchy.indexOf(userRole)

      const requiredRoleMap = {
        'internal': 1, // user+
        'confidential': 2, // creator+
        'restricted': 5 // admin+
      }

      const requiredRoleIndex = requiredRoleMap[dataClass.level as keyof typeof requiredRoleMap] || 0

      if (userRoleIndex >= requiredRoleIndex) {
        return { allowed: true }
      }
    }

    // Admin override
    if (accessControls.includes('admin_override') && ['admin', 'superadmin'].includes(userRole)) {
      await auditLog('data_governance_admin_override', {
        userId,
        userRole,
        dataType,
        operation,
        resourceOwnerId,
        timestamp: new Date().toISOString()
      }, { userId, severity: 'medium' })

      return { allowed: true }
    }

    // Access denied
    await auditLog('data_governance_access_denied', {
      userId,
      userRole,
      dataType,
      operation,
      classification: dataClass.level,
      requiredControls: accessControls,
      timestamp: new Date().toISOString()
    }, { userId, severity: 'medium' })

    return {
      allowed: false,
      reason: `Access denied for ${operation} operation on ${dataClass.level} data`
    }
  }

  /**
   * Generate compliance report
   */
  static async generateComplianceReport(): Promise<{
    storageSystemCompliance: Record<string, { compliant: boolean; issues: string[] }>
    dataTypeCompliance: Record<string, { classification: string; compliant: boolean; issues: string[] }>
    recommendations: string[]
  }> {
    const report = {
      storageSystemCompliance: {} as Record<string, { compliant: boolean; issues: string[] }>,
      dataTypeCompliance: {} as Record<string, { classification: string; compliant: boolean; issues: string[] }>,
      recommendations: [] as string[]
    }

    // Check storage system compliance
    Object.entries(STORAGE_SYSTEMS).forEach(([systemName, system]) => {
      const issues: string[] = []

      if (system.securityLevel === 'basic' && system.dataClassifications.includes('restricted')) {
        issues.push('Basic security level insufficient for restricted data')
      }

      if (system.encryption === 'none' && system.dataClassifications.includes('confidential')) {
        issues.push('Missing encryption for confidential data storage')
      }

      if (!system.auditLogging && system.dataClassifications.includes('restricted')) {
        issues.push('Audit logging required for restricted data')
      }

      report.storageSystemCompliance[systemName] = {
        compliant: issues.length === 0,
        issues
      }
    })

    // Check data type compliance
    Object.entries(DATA_TYPE_CLASSIFICATIONS).forEach(([dataType, classification]) => {
      const dataClass = DATA_CLASSIFICATIONS[classification]
      const issues: string[] = []

      // Check if appropriate storage systems exist
      const suitableStorageSystems = Object.values(STORAGE_SYSTEMS).filter(
        system => system.dataClassifications.includes(dataClass.level)
      )

      if (suitableStorageSystems.length === 0) {
        issues.push(`No storage systems configured for ${dataClass.level} data`)
      }

      report.dataTypeCompliance[dataType] = {
        classification,
        compliant: issues.length === 0,
        issues
      }
    })

    // Generate recommendations
    const recommendations: string[] = []

    if (Object.values(report.storageSystemCompliance).some(s => !s.compliant)) {
      recommendations.push('Upgrade storage system security levels to meet data classification requirements')
    }

    if (Object.values(report.dataTypeCompliance).some(d => !d.compliant)) {
      recommendations.push('Configure additional storage systems to support all data classifications')
    }

    recommendations.push('Implement automated compliance monitoring')
    recommendations.push('Schedule quarterly governance policy reviews')
    recommendations.push('Establish data retention automation')

    report.recommendations = recommendations

    // Audit compliance report generation
    await auditLog('data_governance_compliance_report', {
      totalStorageSystems: Object.keys(STORAGE_SYSTEMS).length,
      compliantStorageSystems: Object.values(report.storageSystemCompliance).filter(s => s.compliant).length,
      totalDataTypes: Object.keys(DATA_TYPE_CLASSIFICATIONS).length,
      compliantDataTypes: Object.values(report.dataTypeCompliance).filter(d => d.compliant).length,
      recommendationCount: recommendations.length,
      timestamp: new Date().toISOString()
    }, { severity: 'low', source: 'data_governance' })

    return report
  }
}

/**
 * Convenience functions for common operations
 */
export const dataGovernance = {
  // Validate video upload
  validateVideoUpload: (userId: string) =>
    DataGovernancePolicy.validateDataStorage('video_files', 'gcs', userId),

  // Validate user data storage
  validateUserData: (userId: string, dataType: 'user_profiles' | 'user_preferences') =>
    DataGovernancePolicy.validateDataStorage(dataType, 'firestore', userId),

  // Validate secure local storage
  validateSecureStorage: (userId: string, dataType: 'upload_tokens' | 'ai_responses') =>
    DataGovernancePolicy.validateDataStorage(dataType, 'secure_local_storage', userId),

  // Check user access
  checkUserAccess: (userId: string, userRole: string, dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS, operation: 'read' | 'write' | 'delete') =>
    DataGovernancePolicy.hasDataAccess(userId, userRole, dataType, operation),

  // Get retention policy
  getRetention: (dataType: keyof typeof DATA_TYPE_CLASSIFICATIONS) =>
    DataGovernancePolicy.getRetentionPolicy(dataType)
}