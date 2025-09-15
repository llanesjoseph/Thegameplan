import { Timestamp } from 'firebase/firestore'

export type CoachingRequestStatus = 'pending' | 'accepted' | 'completed' | 'declined'

export interface CoachingRequest {
  id: string
  studentId: string
  creatorId: string
  status: CoachingRequestStatus
  message: string
  createdAt: Timestamp
  updatedAt?: Timestamp
}


