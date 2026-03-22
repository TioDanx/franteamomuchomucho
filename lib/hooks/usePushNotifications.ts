"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/firestore/notifications";

export function usePushNotifications(coupleId: string | null, uid: string | null) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function requestPermission() {
    if (!coupleId || !uid) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub =
      existing ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      }));

    await savePushSubscription(coupleId, uid, sub);
  }

  useEffect(() => {
    if (!coupleId || !uid) return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});

    // Auto-save subscription if already granted
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          savePushSubscription(coupleId, uid, sub).catch(() => {});
        }
      });
    }
  }, [coupleId, uid]);

  return { permission, requestPermission };
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength);
}
