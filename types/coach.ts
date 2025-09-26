export interface Coach {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  bio?: string
  specialties: string[]
  sports: string[]
  credentials: string[]
  experience: string
  location: string
  hourlyRate?: number
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  timeZone: string
  languages: string[]
  certifications: string[]
  averageRating: number
  totalReviews: number
  isVerified: boolean
  isActive: boolean
  joinedAt: Date
  lastActive?: Date
  socialLinks?: {
    instagram?: string
    youtube?: string
    website?: string
  }
  coachingPhilosophy?: string
  achievements: string[]
}

export interface CoachApplication {
  id: string
  userId: string
  email: string
  displayName: string
  photoURL?: string
  bio: string
  specialties: string[]
  sports: string[]
  credentials: string[]
  experience: string
  location: string
  hourlyRate?: number
  availability: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  timeZone: string
  languages: string[]
  certifications: string[]
  socialLinks?: {
    instagram?: string
    youtube?: string
    website?: string
  }
  coachingPhilosophy?: string
  achievements: string[]
  applicationReason: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
  reviewNotes?: string
}

export interface CoachingSession {
  id: string
  coachId: string
  studentId: string
  type: 'one_on_one' | 'group' | 'file_review'
  sport: string
  topic: string
  scheduledAt: Date
  duration: number // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  meetingLink?: string
  notes?: string
  rating?: number
  feedback?: string
  price: number
  paymentStatus: 'pending' | 'paid' | 'refunded'
  createdAt: Date
  updatedAt: Date
}
