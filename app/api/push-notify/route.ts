import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:noreply@nuestrosplanes.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subscription, title, body, url } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: "Missing subscription" }, { status: 400 });
    }

    await webpush.sendNotification(
      subscription as Parameters<typeof webpush.sendNotification>[0],
      JSON.stringify({ title, body, url: url ?? "/" })
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
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
