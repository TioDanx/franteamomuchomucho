"use client"

import { useCountdown } from "@/lib/hooks/useCountdown"

interface Props {
  targetDate: Date
  compact?: boolean
}

export function CountdownTimer({ targetDate, compact = false }: Props) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate)

  if (isPast) {
    return (
      <span className="font-serif italic text-primary text-sm">
        ¡Ya llegó el momento!
      </span>
    )
  }

  const pad = (n: number) => String(n).padStart(2, "0")

  if (compact) {
    return (
      <span className="font-sans text-xs text-on-surface-variant tabular-nums">
        {days > 0 && `${days}d `}{pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </span>
    )
  }

  return (
    <div className="flex gap-3 items-center">
      {[
        { v: days, l: "días" },
        { v: hours, l: "horas" },
        { v: minutes, l: "min" },
        { v: seconds, l: "seg" },
      ].map(({ v, l }, i) => (
        <div key={l} className="flex items-center gap-3">
          {i > 0 && <div className="w-px h-5 bg-outline-variant/20" />}
          <div className="flex flex-col items-center">
            <span className="font-serif text-xl text-on-surface tabular-nums">{pad(v)}</span>
            <span className="text-on-surface-variant text-[8px] uppercase tracking-widest">{l}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
