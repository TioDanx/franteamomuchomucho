import type { ImportanceLevel } from "@/lib/types"

const config: Record<ImportanceLevel, { label: string; classes: string; dot: string }> = {
  low: {
    label: "Baja",
    classes: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    dot: "bg-emerald-500",
  },
  medium: {
    label: "Media",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-500",
  },
  urgent: {
    label: "Urgente",
    classes: "border-red-500/20 bg-red-500/5 text-red-400",
    dot: "bg-red-500 animate-pulse",
  },
}

export function ImportanceBadge({ level }: { level: ImportanceLevel }) {
  const { label, classes, dot } = config[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}
