import { Timestamp } from "firebase/firestore"
import type { Activity, ActivityLocation } from "@/lib/types"

export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map((n) => chars[n % chars.length])
    .join("")
}

export function mergeDateTime(date: Timestamp, time: string): Date {
  const d = date.toDate()
  const [hours, minutes] = time.split(":").map(Number)
  d.setHours(hours, minutes, 0, 0)
  return d
}

export function getMapsUrl(location: ActivityLocation): string {
  if (location.lat !== undefined && location.lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`
}

export function generateIcs(activity: Activity): string {
  if (!activity.date) return ""

  const start = activity.time
    ? mergeDateTime(activity.date, activity.time)
    : activity.date.toDate()

  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

  const location = activity.location?.address ?? ""

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nuestros Planes//ES",
    "BEGIN:VEVENT",
    `SUMMARY:${activity.name}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    ...(location ? [`LOCATION:${location}`] : []),
    "DESCRIPTION:Plan de Nuestros Planes",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
