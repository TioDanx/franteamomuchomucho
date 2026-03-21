import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Review } from "@/lib/types"

function reviewsCol(coupleId: string, activityId: string) {
  return collection(db, "couples", coupleId, "activities", activityId, "reviews")
}

export async function setReview(
  coupleId: string,
  activityId: string,
  uid: string,
  data: Pick<Review, "rating" | "comment">,
  authorName: string,
  authorPhotoUrl?: string
): Promise<void> {
  await setDoc(doc(reviewsCol(coupleId, activityId), uid), {
    ...data,
    author: uid,
    authorName,
    authorPhotoUrl: authorPhotoUrl ?? null,
    createdAt: serverTimestamp(),
  })
}

export async function deleteReview(coupleId: string, activityId: string, uid: string): Promise<void> {
  await deleteDoc(doc(reviewsCol(coupleId, activityId), uid))
}

export function subscribeReviews(
  coupleId: string,
  activityId: string,
  onData: (reviews: Review[]) => void
): () => void {
  return onSnapshot(reviewsCol(coupleId, activityId), (snap) => {
    const reviews = snap.docs.map((d) => d.data() as Review)
    onData(reviews)
  })
}
