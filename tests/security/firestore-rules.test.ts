import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Firestore Security Rules Tests
 *
 * CRITICAL: These tests validate that Firestore security rules properly protect user data.
 * Failed tests mean potential data breaches, unauthorized access, or privacy violations.
 *
 * Rules file: firestore.rules
 */

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  // Load the actual firestore.rules file
  const rulesPath = resolve(__dirname, '../../firestore.rules')
  const rules = readFileSync(rulesPath, 'utf8')

  testEnv = await initializeTestEnvironment({
    projectId: 'test-project-firestore-rules',
    firestore: {
      rules,
      host: 'localhost',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

describe('Firestore Security Rules - Critical Security Tests', () => {

  describe('Users Collection - Privacy & Role Protection', () => {
    it('should allow users to read their own profile', async () => {
      const alice = testEnv.authenticatedContext('alice')

      // Pre-populate Alice's user document
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('alice').set({
          email: 'alice@example.com',
          role: 'user',
        })
      })

      await assertSucceeds(
        alice.firestore().collection('users').doc('alice').get()
      )
    })

    it('should prevent users from reading other users profiles', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const bob = testEnv.authenticatedContext('bob')

      // Pre-populate Bob's profile
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('bob').set({
          email: 'bob@example.com',
          role: 'user',
        })
      })

      // Alice should NOT be able to read Bob's profile
      await assertFails(
        alice.firestore().collection('users').doc('bob').get()
      )
    })

    it('should allow admins to read any user profile', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      // Pre-populate admin and target user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('users').doc('target-user').set({
          email: 'target@example.com',
          role: 'user',
        })
      })

      await assertSucceeds(
        admin.firestore().collection('users').doc('target-user').get()
      )
    })

    it('should prevent users from changing their own role', async () => {
      const user = testEnv.authenticatedContext('user123')

      // Pre-populate user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
        })
      })

      // User tries to elevate their role to admin
      await assertFails(
        user.firestore().collection('users').doc('user123').update({
          role: 'admin',
        })
      )
    })

    it('should allow admins to change user roles', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      // Pre-populate admin and target user
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('users').doc('target-user').set({
          email: 'target@example.com',
          role: 'user',
        })
      })

      await assertSucceeds(
        admin.firestore().collection('users').doc('target-user').update({
          role: 'creator',
        })
      )
    })

    it('should allow users to update their own profile (except role)', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
          displayName: 'Old Name',
        })
      })

      // User can update displayName
      await assertSucceeds(
        user.firestore().collection('users').doc('user123').update({
          displayName: 'New Name',
        })
      )
    })

    it('should only allow superadmins to delete users', async () => {
      const admin = testEnv.authenticatedContext('admin-user')
      const superadmin = testEnv.authenticatedContext('superadmin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('users').doc('superadmin-user').set({
          email: 'superadmin@example.com',
          role: 'superadmin',
        })
        await context.firestore().collection('users').doc('target-user').set({
          email: 'target@example.com',
          role: 'user',
        })
      })

      // Regular admin cannot delete
      await assertFails(
        admin.firestore().collection('users').doc('target-user').delete()
      )

      // Superadmin can delete
      await assertSucceeds(
        superadmin.firestore().collection('users').doc('target-user').delete()
      )
    })
  })

  describe('Messages Collection - Immutability & Safety', () => {
    it('should allow users to send messages where they are the sender', async () => {
      const alice = testEnv.authenticatedContext('alice')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('alice').set({
          email: 'alice@example.com',
          role: 'athlete',
        })
      })

      await assertSucceeds(
        alice.firestore().collection('messages').add({
          senderId: 'alice',
          recipientId: 'coach-bob',
          content: 'Hi coach, when is our next session?',
          participants: ['alice', 'coach-bob'],
          timestamp: new Date(),
        })
      )
    })

    it('should prevent users from sending messages as someone else', async () => {
      const alice = testEnv.authenticatedContext('alice')

      await assertFails(
        alice.firestore().collection('messages').add({
          senderId: 'bob', // Alice trying to send as Bob
          recipientId: 'coach-charlie',
          content: 'Impersonation attempt',
          participants: ['bob', 'coach-charlie'],
          timestamp: new Date(),
        })
      )
    })

    it('should allow users to read messages where they are sender or recipient', async () => {
      const alice = testEnv.authenticatedContext('alice')

      // Create a message where Alice is sender
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'Hello Bob',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      })

      await assertSucceeds(
        alice.firestore().collection('messages').doc('msg1').get()
      )
    })

    it('should prevent users from reading messages they are not part of', async () => {
      const charlie = testEnv.authenticatedContext('charlie')

      // Create a message between Alice and Bob
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'Private conversation',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      })

      // Charlie should NOT be able to read it
      await assertFails(
        charlie.firestore().collection('messages').doc('msg1').get()
      )
    })

    it('should allow admins to read all messages (moderation)', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'Test message',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      })

      await assertSucceeds(
        admin.firestore().collection('messages').doc('msg1').get()
      )
    })

    it('should prevent message deletion (immutability for legal compliance)', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'This must be permanent',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      })

      // Even the sender cannot delete
      await assertFails(
        alice.firestore().collection('messages').doc('msg1').delete()
      )

      // Even admins cannot delete (legal/audit requirement)
      await assertFails(
        admin.firestore().collection('messages').doc('msg1').delete()
      )
    })

    it('should allow recipients to mark messages as read (and ONLY that)', async () => {
      const bob = testEnv.authenticatedContext('bob')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'Hello Bob',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
          read: false,
        })
      })

      // Bob can mark as read
      await assertSucceeds(
        bob.firestore().collection('messages').doc('msg1').update({
          read: true,
          readAt: new Date(),
        })
      )
    })

    it('should prevent recipients from modifying message content', async () => {
      const bob = testEnv.authenticatedContext('bob')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('messages').doc('msg1').set({
          senderId: 'alice',
          recipientId: 'bob',
          content: 'Original message',
          participants: ['alice', 'bob'],
          timestamp: new Date(),
          read: false,
        })
      })

      // Bob tries to change the content
      await assertFails(
        bob.firestore().collection('messages').doc('msg1').update({
          content: 'Modified message', // Not allowed!
        })
      )
    })

    it('should enforce message size limits (max 2000 characters)', async () => {
      const alice = testEnv.authenticatedContext('alice')

      const tooLongMessage = 'x'.repeat(2001)

      await assertFails(
        alice.firestore().collection('messages').add({
          senderId: 'alice',
          recipientId: 'bob',
          content: tooLongMessage,
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      )
    })

    it('should prevent empty messages', async () => {
      const alice = testEnv.authenticatedContext('alice')

      await assertFails(
        alice.firestore().collection('messages').add({
          senderId: 'alice',
          recipientId: 'bob',
          content: '', // Empty content not allowed
          participants: ['alice', 'bob'],
          timestamp: new Date(),
        })
      )
    })
  })

  describe('Audit Logs - Immutability', () => {
    it('should allow admins to read audit logs', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('auditLogs').doc('log1').set({
          eventType: 'role_change',
          userId: 'user123',
          timestamp: new Date(),
        })
      })

      await assertSucceeds(
        admin.firestore().collection('auditLogs').doc('log1').get()
      )
    })

    it('should prevent non-admins from reading audit logs', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('auditLogs').doc('log1').set({
          eventType: 'login',
          userId: 'user123',
          timestamp: new Date(),
        })
      })

      await assertFails(
        user.firestore().collection('auditLogs').doc('log1').get()
      )
    })

    it('should prevent audit log updates (immutability)', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('auditLogs').doc('log1').set({
          eventType: 'role_change',
          userId: 'user123',
          timestamp: new Date(),
        })
      })

      // Even admins cannot modify audit logs
      await assertFails(
        admin.firestore().collection('auditLogs').doc('log1').update({
          eventType: 'modified', // Not allowed - audit logs are immutable
        })
      )
    })

    it('should prevent audit log deletion (immutability)', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'superadmin',
        })
        await context.firestore().collection('auditLogs').doc('log1').set({
          eventType: 'role_change',
          userId: 'user123',
          timestamp: new Date(),
        })
      })

      // Even superadmins cannot delete audit logs
      await assertFails(
        admin.firestore().collection('auditLogs').doc('log1').delete()
      )
    })
  })

  describe('Feature Flags - Admin Control', () => {
    it('should allow authenticated users to read feature flags', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('feature_flags').doc('flag1').set({
          name: 'newFeature',
          enabled: true,
        })
      })

      await assertSucceeds(
        user.firestore().collection('feature_flags').doc('flag1').get()
      )
    })

    it('should prevent non-admins from writing feature flags', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
        })
      })

      await assertFails(
        user.firestore().collection('feature_flags').doc('flag1').set({
          name: 'hackedFeature',
          enabled: true,
        })
      )
    })

    it('should allow admins to write feature flags', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
      })

      await assertSucceeds(
        admin.firestore().collection('feature_flags').doc('flag1').set({
          name: 'betaFeature',
          enabled: false,
        })
      )
    })
  })

  describe('Admin Invitations - Admin Only Access', () => {
    it('should allow admins to create admin invitations', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
      })

      await assertSucceeds(
        admin.firestore().collection('admin_invitations').add({
          email: 'newadmin@example.com',
          role: 'admin',
          createdBy: 'admin-user',
          status: 'pending',
        })
      )
    })

    it('should prevent non-admins from creating admin invitations', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
        })
      })

      await assertFails(
        user.firestore().collection('admin_invitations').add({
          email: 'hacker@example.com',
          role: 'admin',
          createdBy: 'user123',
          status: 'pending',
        })
      )
    })

    it('should prevent deletion of admin invitations (audit trail)', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('admin_invitations').doc('inv1').set({
          email: 'newadmin@example.com',
          role: 'admin',
          createdBy: 'admin-user',
          status: 'pending',
        })
      })

      // Even admins cannot delete (maintain audit trail)
      await assertFails(
        admin.firestore().collection('admin_invitations').doc('inv1').delete()
      )
    })
  })

  describe('Athletes Collection - Access Control', () => {
    it('should allow athletes to read their own profile', async () => {
      const athlete = testEnv.authenticatedContext('athlete123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('athlete123').set({
          email: 'athlete@example.com',
          role: 'athlete',
        })
        await context.firestore().collection('athletes').doc('ath1').set({
          uid: 'athlete123',
          name: 'John Athlete',
          athleticProfile: {
            primarySport: 'Soccer',
            skillLevel: 'Intermediate',
          },
        })
      })

      await assertSucceeds(
        athlete.firestore().collection('athletes').doc('ath1').get()
      )
    })

    it('should allow coaches to read their athletes profiles', async () => {
      const coach = testEnv.authenticatedContext('coach456')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('coach456').set({
          email: 'coach@example.com',
          role: 'coach',
        })
        await context.firestore().collection('athletes').doc('ath1').set({
          uid: 'athlete123',
          coachId: 'coach456',
          name: 'John Athlete',
          athleticProfile: {
            primarySport: 'Soccer',
          },
        })
      })

      await assertSucceeds(
        coach.firestore().collection('athletes').doc('ath1').get()
      )
    })

    it('should prevent unrelated users from reading athlete profiles', async () => {
      const otherUser = testEnv.authenticatedContext('other-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('other-user').set({
          email: 'other@example.com',
          role: 'user',
        })
        await context.firestore().collection('athletes').doc('ath1').set({
          uid: 'athlete123',
          coachId: 'coach456',
          name: 'John Athlete',
        })
      })

      await assertFails(
        otherUser.firestore().collection('athletes').doc('ath1').get()
      )
    })

    it('should prevent client-side athlete profile creation (server-side only)', async () => {
      const user = testEnv.authenticatedContext('user123')

      await assertFails(
        user.firestore().collection('athletes').add({
          uid: 'user123',
          name: 'Attempted Create',
        })
      )
    })
  })

  describe('Moderation Alerts - Safety Monitoring', () => {
    it('should allow admins to read moderation alerts', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
        await context.firestore().collection('moderation_alerts').doc('alert1').set({
          messageId: 'msg123',
          severity: 'high',
          reason: 'phone_number_detected',
          timestamp: new Date(),
        })
      })

      await assertSucceeds(
        admin.firestore().collection('moderation_alerts').doc('alert1').get()
      )
    })

    it('should prevent non-admins from reading moderation alerts', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('moderation_alerts').doc('alert1').set({
          messageId: 'msg123',
          severity: 'high',
          reason: 'inappropriate_content',
          timestamp: new Date(),
        })
      })

      await assertFails(
        user.firestore().collection('moderation_alerts').doc('alert1').get()
      )
    })

    it('should prevent client-side creation of moderation alerts', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'admin',
        })
      })

      // Even admins can't manually create alerts (system-only)
      await assertFails(
        admin.firestore().collection('moderation_alerts').add({
          messageId: 'msg123',
          severity: 'low',
          reason: 'manual_flag',
        })
      )
    })

    it('should prevent deletion of moderation alerts (permanent record)', async () => {
      const admin = testEnv.authenticatedContext('admin-user')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('admin-user').set({
          email: 'admin@example.com',
          role: 'superadmin',
        })
        await context.firestore().collection('moderation_alerts').doc('alert1').set({
          messageId: 'msg123',
          severity: 'critical',
          reason: 'threat_detected',
          timestamp: new Date(),
        })
      })

      // Even superadmins cannot delete (safety/legal requirement)
      await assertFails(
        admin.firestore().collection('moderation_alerts').doc('alert1').delete()
      )
    })
  })

  describe('Content Collection - Creator Permissions', () => {
    it('should allow creators to create content', async () => {
      const creator = testEnv.authenticatedContext('creator123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('creator123').set({
          email: 'creator@example.com',
          role: 'creator',
        })
      })

      await assertSucceeds(
        creator.firestore().collection('content').add({
          title: 'Soccer Drills 101',
          creatorUid: 'creator123',
          status: 'draft',
          sport: 'Soccer',
        })
      )
    })

    it('should prevent regular users from creating content', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
        })
      })

      await assertFails(
        user.firestore().collection('content').add({
          title: 'Unauthorized Content',
          creatorUid: 'user123',
          status: 'published',
        })
      )
    })

    it('should allow creators to update their own content', async () => {
      const creator = testEnv.authenticatedContext('creator123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('creator123').set({
          email: 'creator@example.com',
          role: 'creator',
        })
        await context.firestore().collection('content').doc('content1').set({
          title: 'Original Title',
          creatorUid: 'creator123',
          status: 'draft',
        })
      })

      await assertSucceeds(
        creator.firestore().collection('content').doc('content1').update({
          title: 'Updated Title',
          status: 'published',
        })
      )
    })

    it('should prevent creators from modifying other creators content', async () => {
      const creator1 = testEnv.authenticatedContext('creator1')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('creator1').set({
          email: 'creator1@example.com',
          role: 'creator',
        })
        await context.firestore().collection('content').doc('content1').set({
          title: 'Creator 2 Content',
          creatorUid: 'creator2', // Different creator
          status: 'published',
        })
      })

      await assertFails(
        creator1.firestore().collection('content').doc('content1').update({
          title: 'Hijacked Title',
        })
      )
    })

    it('should only show published content to regular users', async () => {
      const user = testEnv.authenticatedContext('user123')

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('users').doc('user123').set({
          email: 'user@example.com',
          role: 'user',
        })
        await context.firestore().collection('content').doc('published1').set({
          title: 'Published Content',
          creatorUid: 'creator123',
          status: 'published',
        })
        await context.firestore().collection('content').doc('draft1').set({
          title: 'Draft Content',
          creatorUid: 'creator123',
          status: 'draft',
        })
      })

      // Can read published
      await assertSucceeds(
        user.firestore().collection('content').doc('published1').get()
      )

      // Cannot read draft
      await assertFails(
        user.firestore().collection('content').doc('draft1').get()
      )
    })
  })
})
