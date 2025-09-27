import { adminDb as db } from '@/lib/firebase.admin'
import { auditLog } from '@/lib/audit-logger'

interface CoachApplicationData {
  id: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  phone: string
  sport: string
  experience: string
  credentials: string
  tagline: string
  philosophy: string
  specialties: string[]
  achievements: string[]
  references: string[]
  sampleQuestions: string[]
  bio: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  ingestionData?: {
    organizationName: string
    inviterName: string
    inviterEmail: string
    inviterUserId: string
    sport: string
    autoApprove: boolean
  }
}

interface CoachProfile {
  uid: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  phone?: string
  role: 'coach'
  sport: string
  experience: string
  credentials?: string
  tagline?: string
  philosophy?: string
  specialties: string[]
  achievements: string[]
  references: string[]
  sampleQuestions: string[]
  bio: string
  profileCompleteness: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  onboardedVia: 'ingestion_link' | 'manual'
  organizationAffiliation?: {
    organizationName: string
    inviterName: string
    inviterEmail: string
    inviterUserId: string
  }
}

export async function autoPopulateCoachProfile(applicationId: string): Promise<boolean> {
  try {
    // Get the coach application
    const applicationDoc = await db.collection('coach_applications').doc(applicationId).get()

    if (!applicationDoc.exists) {
      throw new Error('Coach application not found')
    }

    const applicationData = applicationDoc.data() as CoachApplicationData

    // Check if application is approved
    if (applicationData.status !== 'approved') {
      throw new Error('Application must be approved before creating profile')
    }

    // Check if user already exists
    let userDoc = await db.collection('users').where('email', '==', applicationData.email).get()
    let userId: string

    if (userDoc.empty) {
      // Create new user
      userId = applicationData.id // Use application ID as user ID for consistency
      await createNewUser(userId, applicationData)
    } else {
      // Update existing user
      userId = userDoc.docs[0].id
      await updateExistingUser(userId, applicationData)
    }

    // Create or update coach profile
    const coachProfile: CoachProfile = {
      uid: userId,
      email: applicationData.email,
      displayName: applicationData.displayName || `${applicationData.firstName} ${applicationData.lastName}`,
      firstName: applicationData.firstName,
      lastName: applicationData.lastName,
      phone: applicationData.phone,
      role: 'coach',
      sport: applicationData.sport,
      experience: applicationData.experience,
      credentials: applicationData.credentials,
      tagline: applicationData.tagline,
      philosophy: applicationData.philosophy,
      specialties: applicationData.specialties || [],
      achievements: applicationData.achievements || [],
      references: applicationData.references || [],
      sampleQuestions: applicationData.sampleQuestions || [],
      bio: applicationData.bio,
      profileCompleteness: calculateProfileCompleteness(applicationData),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      onboardedVia: 'ingestion_link',
      organizationAffiliation: applicationData.ingestionData ? {
        organizationName: applicationData.ingestionData.organizationName,
        inviterName: applicationData.ingestionData.inviterName,
        inviterEmail: applicationData.ingestionData.inviterEmail,
        inviterUserId: applicationData.ingestionData.inviterUserId
      } : undefined
    }

    // Save coach profile
    await db.collection('coach_profiles').doc(userId).set(coachProfile)

    // Update user role
    await db.collection('users').doc(userId).update({
      role: 'coach',
      updatedAt: new Date()
    })

    // Update application status
    await db.collection('coach_applications').doc(applicationId).update({
      status: 'profile_created',
      profileCreatedAt: new Date(),
      updatedAt: new Date()
    })

    // Audit log
    await auditLog('coach_profile_auto_populated', {
      applicationId,
      userId,
      email: applicationData.email,
      sport: applicationData.sport,
      organizationName: applicationData.ingestionData?.organizationName,
      profileCompleteness: coachProfile.profileCompleteness
    })

    return true

  } catch (error) {
    console.error('Failed to auto-populate coach profile:', error)

    // Log error to audit
    await auditLog('coach_profile_auto_population_failed', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return false
  }
}

async function createNewUser(userId: string, applicationData: CoachApplicationData) {
  const userData = {
    uid: userId,
    email: applicationData.email,
    displayName: applicationData.displayName || `${applicationData.firstName} ${applicationData.lastName}`,
    firstName: applicationData.firstName,
    lastName: applicationData.lastName,
    phone: applicationData.phone,
    role: 'coach',
    isActive: true,
    emailVerified: false, // They'll need to verify their email
    createdAt: new Date(),
    updatedAt: new Date(),
    signupMethod: 'coach_ingestion',
    profileComplete: false
  }

  await db.collection('users').doc(userId).set(userData)
}

async function updateExistingUser(userId: string, applicationData: CoachApplicationData) {
  const updateData = {
    role: 'coach',
    firstName: applicationData.firstName,
    lastName: applicationData.lastName,
    displayName: applicationData.displayName || `${applicationData.firstName} ${applicationData.lastName}`,
    phone: applicationData.phone,
    updatedAt: new Date()
  }

  await db.collection('users').doc(userId).update(updateData)
}

function calculateProfileCompleteness(applicationData: CoachApplicationData): number {
  const fields = [
    applicationData.email,
    applicationData.firstName,
    applicationData.lastName,
    applicationData.sport,
    applicationData.experience,
    applicationData.bio,
    applicationData.tagline,
    applicationData.philosophy,
    applicationData.credentials,
    applicationData.specialties?.length > 0,
    applicationData.achievements?.length > 0,
    applicationData.sampleQuestions?.length > 0
  ]

  const completedFields = fields.filter(field =>
    field !== undefined && field !== null && field !== ''
  ).length

  return Math.round((completedFields / fields.length) * 100)
}

export async function approveCoachApplicationAndCreateProfile(applicationId: string): Promise<boolean> {
  try {
    // First approve the application
    await db.collection('coach_applications').doc(applicationId).update({
      status: 'approved',
      approvedAt: new Date(),
      updatedAt: new Date()
    })

    // Then auto-populate the profile
    return await autoPopulateCoachProfile(applicationId)

  } catch (error) {
    console.error('Failed to approve application and create profile:', error)
    return false
  }
}

export async function getCoachApplications(filters?: {
  status?: string
  sport?: string
  organizationName?: string
  limit?: number
}) {
  try {
    let query = db.collection('coach_applications').orderBy('submittedAt', 'desc')

    if (filters?.status) {
      query = query.where('status', '==', filters.status)
    }

    if (filters?.sport) {
      query = query.where('sport', '==', filters.sport)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  } catch (error) {
    console.error('Failed to get coach applications:', error)
    return []
  }
}

export async function getCoachProfiles(filters?: {
  sport?: string
  organizationName?: string
  isActive?: boolean
  limit?: number
}) {
  try {
    let query = db.collection('coach_profiles').orderBy('createdAt', 'desc')

    if (filters?.sport) {
      query = query.where('sport', '==', filters.sport)
    }

    if (filters?.isActive !== undefined) {
      query = query.where('isActive', '==', filters.isActive)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

  } catch (error) {
    console.error('Failed to get coach profiles:', error)
    return []
  }
}