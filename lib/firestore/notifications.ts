import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";

export async function savePushSubscription(
  coupleId: string,
  uid: string,
  subscription: PushSubscription
) {
  const ref = doc(db, "couples", coupleId, "pushSubscriptions", uid);
  await setDoc(ref, { subscription: subscription.toJSON(), uid });
}

export async function deletePushSubscription(coupleId: string, uid: string) {
  const ref = doc(db, "couples", coupleId, "pushSubscriptions", uid);
  await deleteDoc(ref);
}

export async function getPushSubscription(
  coupleId: string,
  uid: string
): Promise<PushSubscriptionJSON | null> {
  const ref = doc(db, "couples", coupleId, "pushSubscriptions", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data().subscription as PushSubscriptionJSON;
}
