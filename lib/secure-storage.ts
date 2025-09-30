/**
 * Secure Storage Service
 * Encrypted localStorage with token rotation and audit logging
 */

import { auditLog } from '@/lib/audit-logger'

interface SecureStorageOptions {
  ttl?: number // Time to live in milliseconds
  rotate?: boolean // Whether to rotate encryption keys
  audit?: boolean // Whether to audit access
}

interface StoredData {
  data: string // Encrypted data
  timestamp: number
  ttl?: number
  keyId: string // Which encryption key was used
  version: number // Data format version
}

class SecureStorage {
  private keyStore: Map<string, CryptoKey> = new Map()
  private currentKeyId: string = 'default'
  private readonly VERSION = 1
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours
  private initialized: boolean = false

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.initializeKeys()
    }
  }

  /**
   * Check if running in browser environment
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
  }

  /**
   * Ensure initialization before any operation
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isBrowser()) {
      throw new Error('SecureStorage can only be used in browser environment')
    }
    if (!this.initialized) {
      await this.initializeKeys()
      this.initialized = true
    }
  }

  /**
   * Initialize encryption keys
   */
  private async initializeKeys(): Promise<void> {
    if (!this.isBrowser()) return

    try {
      // Generate or retrieve encryption key
      const key = await this.generateOrRetrieveKey()
      this.keyStore.set(this.currentKeyId, key)

      // Schedule key rotation (every 7 days)
      this.scheduleKeyRotation()

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize secure storage keys:', error)
      await auditLog('secure_storage_key_init_failed', {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
    }
  }

  /**
   * Generate new encryption key or retrieve existing one
   */
  private async generateOrRetrieveKey(): Promise<CryptoKey> {
    const keyData = localStorage.getItem('__gp_master_key')

    if (keyData) {
      try {
        // Import existing key
        const keyBuffer = this.base64ToArrayBuffer(keyData)
        return await crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        )
      } catch (error) {
        console.warn('Failed to import existing key, generating new one')
      }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    // Store key for persistence (in production, consider more secure storage)
    const keyBuffer = await crypto.subtle.exportKey('raw', key)
    const keyString = this.arrayBufferToBase64(keyBuffer)
    localStorage.setItem('__gp_master_key', keyString)

    await auditLog('secure_storage_key_generated', {
      keyId: this.currentKeyId,
      timestamp: new Date().toISOString()
    }, { severity: 'low' })

    return key
  }

  /**
   * Store data securely with encryption
   */
  async setItem(
    key: string,
    value: any,
    options: SecureStorageOptions = {}
  ): Promise<void> {
    await this.ensureInitialized()

    try {
      const ttl = options.ttl || this.DEFAULT_TTL
      const audit = options.audit !== false // Default to true

      if (audit) {
        await auditLog('secure_storage_write', {
          key: this.hashKey(key),
          hasValue: !!value,
          ttl,
          timestamp: new Date().toISOString()
        }, { severity: 'low', source: 'secure_storage' })
      }

      // Serialize and encrypt data
      const serialized = JSON.stringify(value)
      const encrypted = await this.encrypt(serialized)

      const storedData: StoredData = {
        data: encrypted,
        timestamp: Date.now(),
        ttl,
        keyId: this.currentKeyId,
        version: this.VERSION
      }

      // Store in localStorage
      localStorage.setItem(`__gp_secure_${key}`, JSON.stringify(storedData))

    } catch (error) {
      console.error('Failed to store secure data:', error)
      await auditLog('secure_storage_write_failed', {
        key: this.hashKey(key),
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
      throw new Error('Failed to store secure data')
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async getItem<T = any>(key: string, options: { audit?: boolean } = {}): Promise<T | null> {
    await this.ensureInitialized()

    try {
      const audit = options.audit !== false // Default to true

      const stored = localStorage.getItem(`__gp_secure_${key}`)
      if (!stored) {
        if (audit) {
          await auditLog('secure_storage_read_not_found', {
            key: this.hashKey(key),
            timestamp: new Date().toISOString()
          }, { severity: 'low', source: 'secure_storage' })
        }
        return null
      }

      const storedData: StoredData = JSON.parse(stored)

      // Check expiration
      if (storedData.ttl && Date.now() > storedData.timestamp + storedData.ttl) {
        await this.removeItem(key, { audit: false })
        if (audit) {
          await auditLog('secure_storage_read_expired', {
            key: this.hashKey(key),
            age: Date.now() - storedData.timestamp,
            ttl: storedData.ttl,
            timestamp: new Date().toISOString()
          }, { severity: 'low', source: 'secure_storage' })
        }
        return null
      }

      // Decrypt data
      const decrypted = await this.decrypt(storedData.data, storedData.keyId)
      const value = JSON.parse(decrypted)

      if (audit) {
        await auditLog('secure_storage_read', {
          key: this.hashKey(key),
          age: Date.now() - storedData.timestamp,
          keyId: storedData.keyId,
          timestamp: new Date().toISOString()
        }, { severity: 'low', source: 'secure_storage' })
      }

      return value

    } catch (error) {
      console.error('Failed to retrieve secure data:', error)
      await auditLog('secure_storage_read_failed', {
        key: this.hashKey(key),
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
      return null
    }
  }

  /**
   * Remove item from secure storage
   */
  async removeItem(key: string, options: { audit?: boolean } = {}): Promise<void> {
    await this.ensureInitialized()

    try {
      const audit = options.audit !== false

      localStorage.removeItem(`__gp_secure_${key}`)

      if (audit) {
        await auditLog('secure_storage_delete', {
          key: this.hashKey(key),
          timestamp: new Date().toISOString()
        }, { severity: 'low', source: 'secure_storage' })
      }

    } catch (error) {
      console.error('Failed to remove secure data:', error)
      await auditLog('secure_storage_delete_failed', {
        key: this.hashKey(key),
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'medium' })
    }
  }

  /**
   * Clear all secure storage
   */
  async clear(): Promise<void> {
    await this.ensureInitialized()

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('__gp_secure_'))

      for (const key of keys) {
        localStorage.removeItem(key)
      }

      await auditLog('secure_storage_clear_all', {
        clearedCount: keys.length,
        timestamp: new Date().toISOString()
      }, { severity: 'medium', source: 'secure_storage' })

    } catch (error) {
      console.error('Failed to clear secure storage:', error)
      await auditLog('secure_storage_clear_failed', {
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      }, { severity: 'high' })
    }
  }

  /**
   * Encrypt data using current key
   */
  private async encrypt(data: string): Promise<string> {
    const key = this.keyStore.get(this.currentKeyId)
    if (!key) throw new Error('Encryption key not available')

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(data)

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return this.arrayBufferToBase64(combined.buffer)
  }

  /**
   * Decrypt data using specified key
   */
  private async decrypt(encryptedData: string, keyId: string): Promise<string> {
    const key = this.keyStore.get(keyId)
    if (!key) throw new Error(`Encryption key '${keyId}' not available`)

    const combined = this.base64ToArrayBuffer(encryptedData)
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    return new TextDecoder().decode(decrypted)
  }

  /**
   * Schedule key rotation
   */
  private scheduleKeyRotation(): void {
    const ROTATION_INTERVAL = 7 * 24 * 60 * 60 * 1000 // 7 days

    setInterval(async () => {
      try {
        await this.rotateKeys()
      } catch (error) {
        console.error('Key rotation failed:', error)
        await auditLog('secure_storage_key_rotation_failed', {
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        }, { severity: 'high' })
      }
    }, ROTATION_INTERVAL)
  }

  /**
   * Rotate encryption keys
   */
  private async rotateKeys(): Promise<void> {
    const oldKeyId = this.currentKeyId
    this.currentKeyId = `key_${Date.now()}`

    // Generate new key
    const newKey = await this.generateOrRetrieveKey()
    this.keyStore.set(this.currentKeyId, newKey)

    await auditLog('secure_storage_key_rotated', {
      oldKeyId,
      newKeyId: this.currentKeyId,
      timestamp: new Date().toISOString()
    }, { severity: 'low' })

    // Note: In production, you'd want to re-encrypt existing data with the new key
    // For now, old data will still be accessible with the old key
  }

  /**
   * Hash key for audit logs (privacy)
   */
  private hashKey(key: string): string {
    const encoder = new TextEncoder()
    const data = encoder.encode(key + 'salt')
    return btoa(String.fromCharCode(...data)).substring(0, 16)
  }

  /**
   * Utility functions for base64 conversion
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage()

/**
 * Convenience functions for common usage patterns
 */
export const secureLocalStorage = {
  // Video upload tokens with shorter TTL
  setUploadToken: (videoId: string, token: string) =>
    secureStorage.setItem(`upload_token_${videoId}`, token, {
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      audit: true
    }),

  getUploadToken: (videoId: string) =>
    secureStorage.getItem<string>(`upload_token_${videoId}`),

  removeUploadToken: (videoId: string) =>
    secureStorage.removeItem(`upload_token_${videoId}`),

  // Upload states with auto-expiry
  setUploadState: (videoId: string, state: any) =>
    secureStorage.setItem(`upload_state_${videoId}`, state, {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      audit: false
    }),

  getUploadState: (videoId: string) =>
    secureStorage.getItem(`upload_state_${videoId}`),

  // Saved responses with longer TTL
  setSavedResponse: (key: string, response: any) =>
    secureStorage.setItem(`saved_response_${key}`, response, {
      ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
      audit: false
    }),

  getSavedResponse: (key: string) =>
    secureStorage.getItem(`saved_response_${key}`)
}