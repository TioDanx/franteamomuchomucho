import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Activity, ActivityLocation } from "@/lib/types"

function activitiesCol(coupleId: string) {
  return collection(db, "couples", coupleId, "activities")
}

function activityDoc(coupleId: string, activityId: string) {
  return doc(db, "couples", coupleId, "activities", activityId)
}

export function subscribeActivities(
  coupleId: string,
  onData: (activities: Activity[]) => void,
  onError: (err: Error) => void
): () => void {
  const q = query(activitiesCol(coupleId), orderBy("createdAt", "desc"))
  return onSnapshot(
    q,
    (snap) => {
      const activities = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Activity))
      onData(activities)
    },
    onError
  )
}

export async function addActivity(
  coupleId: string,
  data: Pick<Activity, "name" | "photoUrl" | "importance" | "createdBy">
): Promise<string> {
  const ref = await addDoc(activitiesCol(coupleId), {
    ...data,
    status: "todo",
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateActivity(
  coupleId: string,
  activityId: string,
  data: Partial<Pick<Activity, "name" | "photoUrl" | "importance">>
): Promise<void> {
  await updateDoc(activityDoc(coupleId, activityId), data)
}

export async function deleteActivity(coupleId: string, activityId: string): Promise<void> {
  await deleteDoc(activityDoc(coupleId, activityId))
}

export async function getActivity(coupleId: string, activityId: string): Promise<Activity | null> {
  const snap = await getDoc(activityDoc(coupleId, activityId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Activity
}

export async function confirmActivity(
  coupleId: string,
  activityId: string,
  details: { date: Timestamp; time: string; location?: ActivityLocation }
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = activityDoc(coupleId, activityId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error("Actividad no encontrada")
    if (snap.data().status !== "todo") throw new Error("Solo se pueden confirmar actividades en estado 'todo'")
    tx.update(ref, { status: "confirmed", ...details })
  })
}

export async function updateConfirmedActivity(
  coupleId: string,
  activityId: string,
  details: { date: Timestamp; time: string; location?: ActivityLocation }
): Promise<void> {
  await updateDoc(activityDoc(coupleId, activityId), details)
}

export async function completeActivity(coupleId: string, activityId: string): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = activityDoc(coupleId, activityId)
    const snap = await tx.get(ref)
    if (!snap.exists()) throw new Error("Actividad no encontrada")
    if (snap.data().status !== "confirmed") throw new Error("Solo se pueden completar actividades confirmadas")
    tx.update(ref, { status: "done", completedAt: serverTimestamp() })
  })
}
