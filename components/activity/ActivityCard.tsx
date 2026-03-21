import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Activity } from "@/lib/types"
import { ImportanceBadge } from "./ImportanceBadge"
import { CountdownTimer } from "./CountdownTimer"
import { StarRating } from "./StarRating"

interface Props {
  activity: Activity
  coupleId: string
}

export function ActivityCard({ activity, coupleId }: Props) {
  const href = `/activity/${activity.id}`

  return (
    <Link href={href}>
      <div className="bg-surface-container-low flex items-center p-4 rounded-[20px] transition-all hover:bg-surface-container active:scale-[0.98] group relative overflow-hidden">
        {/* Photo */}
        <div className="w-20 h-20 rounded-[12px] overflow-hidden flex-shrink-0 bg-surface-container-high">
          {activity.photoUrl ? (
            <img
              src={activity.photoUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30 text-3xl">
              ♥
            </div>
          )}
        </div>

        {/* Content */}
        <div className="ml-4 flex-grow min-w-0">
          <h3 className="font-serif text-xl font-medium text-on-surface leading-tight truncate">
            {activity.name}
          </h3>

          <div className="mt-2">
            {activity.status === "todo" && (
              <div className="flex flex-col gap-2">
                <ImportanceBadge level={activity.importance} />
              </div>
            )}

            {activity.status === "confirmed" && activity.date && (
              <div className="flex flex-col gap-1.5">
                <ImportanceBadge level={activity.importance} />
                <CountdownTimer
                  targetDate={activity.date.toDate()}
                  compact
                />
              </div>
            )}

            {activity.status === "done" && (
              <div className="flex flex-col gap-1">
                <StarRating value={0} readonly size="sm" />
                {activity.completedAt && (
                  <span className="text-on-surface-variant text-xs">
                    {format(activity.completedAt.toDate(), "d MMM yyyy", { locale: es })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <span className="text-outline-variant/60 group-hover:text-primary transition-colors ml-2 flex-shrink-0">
          ›
        </span>
      </div>
    </Link>
  )
}
