import { Timestamp } from "firebase/firestore"

// Auth & Users
export interface UserProfile {
  uid: string
  displayName: string
  photoURL?: string
  coupleId: string | null
  createdAt: Timestamp
}

// Couple
export interface Couple {
  members: string[]
  roles: Record<string, "owner" | "member">
  memberNames: Record<string, string>
  memberPhotos: Record<string, string>
  createdAt: Timestamp
}

// Invite
export interface Invite {
  coupleId: string
  createdBy: string
  creatorName?: string
  creatorPhoto?: string
  createdAt: Timestamp
  expiresAt: Timestamp
  usedBy: string | null
}

// Activity
export type ImportanceLevel = "low" | "medium" | "urgent"
export type ActivityStatus = "todo" | "confirmed" | "done"

export interface ActivityLocation {
  address: string
  lat?: number
  lng?: number
}

export interface Activity {
  id: string
  name: string
  photoUrl: string
  importance: ImportanceLevel
  status: ActivityStatus
  date?: Timestamp
  time?: string
  location?: ActivityLocation
  createdBy: string
  createdAt: Timestamp
  completedAt?: Timestamp
}

// Review
export interface Review {
  rating: number
  comment?: string
  author: string
  authorName: string
  authorPhotoUrl?: string
  createdAt: Timestamp
}

// Gallery
export interface GalleryPhoto {
  id: string
  url: string
  cloudinaryId?: string
  uploadedBy: string
  uploadedAt: Timestamp
}

// Config
export interface CountdownConfig {
  targetDate: Timestamp
  updatedBy: string
  updatedAt: Timestamp
}
