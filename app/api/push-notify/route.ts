import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

webpush.setVapidDetails(
  "mailto:noreply@nuestrosplanes.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { coupleId, senderUid, senderName, title, body, url } =
      await req.json();

    if (!coupleId || !senderUid) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    // Get couple to find partner uid
    const coupleSnap = await getDoc(doc(db, "couples", coupleId));
    if (!coupleSnap.exists()) {
      return NextResponse.json({ error: "Couple not found" }, { status: 404 });
    }
    const members: string[] = coupleSnap.data().members ?? [];
    const partnerUid = members.find((m) => m !== senderUid);
    if (!partnerUid) {
      return NextResponse.json({ ok: true, skipped: "no partner" });
    }

    // Get partner's push subscription
    const subSnap = await getDoc(
      doc(db, "couples", coupleId, "pushSubscriptions", partnerUid)
    );
    if (!subSnap.exists()) {
      return NextResponse.json({ ok: true, skipped: "no subscription" });
    }
    const subscription = subSnap.data().subscription as PushSubscriptionJSON;

    await webpush.sendNotification(
      subscription as Parameters<typeof webpush.sendNotification>[0],
      JSON.stringify({ title, body, url: url ?? "/" })
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // 410 Gone = subscription expired/unregistered
    if (
      err &&
      typeof err === "object" &&
      "statusCode" in err &&
      (err as { statusCode: number }).statusCode === 410
    ) {
      return NextResponse.json({ ok: true, skipped: "expired" });
    }
    console.error("[push-notify]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
