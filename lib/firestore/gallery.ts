import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import imageCompression from "browser-image-compression"
import { db } from "@/lib/firebase"
import type { GalleryPhoto } from "@/lib/types"

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!

function galleryCol(coupleId: string, activityId: string) {
  return collection(db, "couples", coupleId, "activities", activityId, "gallery")
}

async function uploadToCloudinary(
  file: File,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  })

  const formData = new FormData()
  formData.append("file", compressed)
  formData.append("upload_preset", UPLOAD_PRESET)
  formData.append("folder", folder)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) throw new Error("Error al subir la imagen")

  const data = await res.json()
  return { url: data.secure_url as string, publicId: data.public_id as string }
}

/** Upload a hero image for an activity. Returns the Cloudinary URL (does NOT add to gallery). */
export async function uploadHeroPhoto(
  coupleId: string,
  activityId: string,
  file: File
): Promise<string> {
  const { url } = await uploadToCloudinary(
    file,
    `couple-goals/${coupleId}/${activityId}/hero`
  )
  return url
}

/** Upload a photo to the activity gallery (only for completed activities). */
export async function uploadPhoto(
  coupleId: string,
  activityId: string,
  uid: string,
  file: File
): Promise<void> {
  const { url, publicId } = await uploadToCloudinary(
    file,
    `couple-goals/${coupleId}/${activityId}`
  )

  await addDoc(galleryCol(coupleId, activityId), {
    url,
    cloudinaryId: publicId,
    uploadedBy: uid,
    uploadedAt: serverTimestamp(),
  })
}

export function subscribeGallery(
  coupleId: string,
  activityId: string,
  onData: (photos: GalleryPhoto[]) => void
): () => void {
  return onSnapshot(galleryCol(coupleId, activityId), (snap) => {
    const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryPhoto))
    onData(photos)
  })
}

export async function deletePhoto(
  coupleId: string,
  activityId: string,
  photoId: string,
  cloudinaryId?: string
): Promise<void> {
  // Delete from Cloudinary first (best-effort — don't block on failure)
  if (cloudinaryId) {
    try {
      await fetch("/api/cloudinary-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cloudinaryId }),
      })
    } catch {
      // Non-fatal: Firestore doc is still removed below
    }
  }

  await deleteDoc(doc(galleryCol(coupleId, activityId), photoId))
}
