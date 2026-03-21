import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { generateInviteCode } from "@/lib/utils"
import type { Couple, Invite } from "@/lib/types"

export interface InvitePreview {
  creatorName: string
  creatorPhoto?: string
}

export async function createCouple(
  ownerUid: string,
  ownerDisplayName: string,
  ownerPhotoURL?: string
): Promise<string> {
  const coupleRef = doc(db, "couples", crypto.randomUUID())
  const code = generateInviteCode()
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

  await setDoc(coupleRef, {
    members: [ownerUid],
    roles: { [ownerUid]: "owner" },
    memberNames: { [ownerUid]: ownerDisplayName },
    memberPhotos: { [ownerUid]: ownerPhotoURL ?? "" },
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, "invites", code), {
    coupleId: coupleRef.id,
    createdBy: ownerUid,
    creatorName: ownerDisplayName,
    creatorPhoto: ownerPhotoURL ?? null,
    createdAt: serverTimestamp(),
    expiresAt,
    usedBy: null,
  })

  await updateDoc(doc(db, "users", ownerUid), { coupleId: coupleRef.id })

  return code
}

export async function joinCouple(
  uid: string,
  displayName: string,
  code: string,
  photoURL?: string
): Promise<string> {
  const inviteSnap = await getDoc(doc(db, "invites", code))

  if (!inviteSnap.exists()) throw new Error("Código no válido")

  const invite = inviteSnap.data() as Invite
  const now = Timestamp.now()

  if (invite.usedBy !== null) throw new Error("Este código ya fue usado")
  if (invite.expiresAt.toMillis() < now.toMillis()) throw new Error("El código ha expirado")

  const { coupleId } = invite

  await updateDoc(doc(db, "couples", coupleId), {
    members: arrayUnion(uid),
    [`roles.${uid}`]: "member",
    [`memberNames.${uid}`]: displayName,
    [`memberPhotos.${uid}`]: photoURL ?? "",
  })

  await updateDoc(doc(db, "invites", code), { usedBy: uid })
  await updateDoc(doc(db, "users", uid), { coupleId })

  return coupleId
}

export async function getInvitePreview(code: string): Promise<InvitePreview | null> {
  const inviteSnap = await getDoc(doc(db, "invites", code))
  if (!inviteSnap.exists()) return null
  const invite = inviteSnap.data() as Invite
  if (invite.usedBy !== null) return null
  if (invite.expiresAt.toMillis() < Timestamp.now().toMillis()) return null

  return {
    creatorName: invite.creatorName ?? "tu pareja",
    creatorPhoto: invite.creatorPhoto ?? undefined,
  }
}

export async function getCouple(coupleId: string): Promise<Couple | null> {
  const snap = await getDoc(doc(db, "couples", coupleId))
  if (!snap.exists()) return null
  return snap.data() as Couple
}

export async function updateMemberPhoto(
  coupleId: string,
  uid: string,
  photoURL: string
): Promise<void> {
  await updateDoc(doc(db, "couples", coupleId), {
    [`memberPhotos.${uid}`]: photoURL,
  })
}
