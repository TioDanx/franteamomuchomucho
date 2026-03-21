import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CountdownConfig } from "@/lib/types"

function configDoc(coupleId: string) {
  return doc(db, "couples", coupleId, "config", "countdown")
}

export async function getCountdown(coupleId: string): Promise<CountdownConfig | null> {
  const snap = await getDoc(configDoc(coupleId))
  if (!snap.exists()) return null
  return snap.data() as CountdownConfig
}

export async function setCountdown(
  coupleId: string,
  uid: string,
  targetDate: Timestamp
): Promise<void> {
  await setDoc(configDoc(coupleId), {
    targetDate,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCountdown(coupleId: string): Promise<void> {
  await deleteDoc(configDoc(coupleId))
}
