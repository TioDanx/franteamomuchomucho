export type NotificationEvent =
  | "activity_created"
  | "activity_updated"
  | "activity_confirmed"
  | "activity_completed"
  | "review_created"
  | "review_updated"
  | "countdown_created"
  | "countdown_deleted";

interface NotifyPartnerArgs {
  coupleId: string;
  senderUid: string;
  senderName: string;
  event: NotificationEvent;
  activityName?: string;
  activityId?: string;
}

const MESSAGES: Record<
  NotificationEvent,
  (name: string, activity?: string) => { title: string; body: string }
> = {
  activity_created: (n, a) => ({
    title: "📅 Nueva actividad",
    body: `${n} ha añadido "${a}"`,
  }),
  activity_updated: (n, a) => ({
    title: "✏️ Actividad actualizada",
    body: `${n} ha modificado "${a}"`,
  }),
  activity_confirmed: (n, a) => ({
    title: "✅ Plan confirmado",
    body: `${n} ha confirmado "${a}"`,
  }),
  activity_completed: (n, a) => ({
    title: "🎉 ¡Plan completado!",
    body: `${n} ha completado "${a}"`,
  }),
  review_created: (n, a) => ({
    title: "⭐ Nueva reseña",
    body: `${n} ha dejado una reseña de "${a}"`,
  }),
  review_updated: (n, a) => ({
    title: "⭐ Reseña actualizada",
    body: `${n} ha editado su reseña de "${a}"`,
  }),
  countdown_created: (n) => ({
    title: "⏰ Cuenta regresiva",
    body: `${n} ha añadido una fecha especial`,
  }),
  countdown_deleted: (n) => ({
    title: "⏰ Cuenta regresiva eliminada",
    body: `${n} ha eliminado la fecha especial`,
  }),
};

export async function notifyPartner({
  coupleId,
  senderUid,
  senderName,
  event,
  activityName,
  activityId,
}: NotifyPartnerArgs) {
  try {
    const { title, body } = MESSAGES[event](senderName, activityName);
    const url = activityId ? `/activity/${activityId}` : "/dashboard";
    await fetch("/api/push-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coupleId, senderUid, senderName, title, body, url }),
    });
  } catch {
    // Best-effort, never throw
  }
}
