import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { UserProfile } from "@/lib/types"

export async function createUserProfile(uid: string, displayName: string, photoURL?: string): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    displayName,
    photoURL: photoURL ?? null,
    coupleId: null,
    createdAt: serverTimestamp(),
  })
}

export async function updateUserPhotoURL(uid: string, photoURL: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { photoURL })
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function updateUserCoupleId(uid: string, coupleId: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { coupleId })
}

export async function updateUserDisplayName(uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { displayName })
}
