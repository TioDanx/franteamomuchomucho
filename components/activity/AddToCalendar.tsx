"use client"

import { generateIcs } from "@/lib/utils"
import type { Activity } from "@/lib/types"

export function AddToCalendar({ activity }: { activity: Activity }) {
  if (!activity.date) return null

  function handleClick() {
    const ics = generateIcs(activity)
    if (!ics) return
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activity.name}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-secondary/80 to-secondary text-on-secondary font-bold text-sm shadow-lg shadow-secondary/10 hover:brightness-110 transition-all active:scale-95 w-full"
    >
      📅 Al calendario
    </button>
  )
}
