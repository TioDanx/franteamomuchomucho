"use client"

interface Props {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
}

const sizes = { sm: "text-base", md: "text-2xl", lg: "text-3xl" }

export function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizes[size]} transition-transform ${
            readonly ? "cursor-default" : "hover:scale-110 active:scale-95 cursor-pointer"
          }`}
          aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
        >
          <span className={star <= value ? "text-yellow-400" : "text-on-surface-variant/20"}>
            ★
          </span>
        </button>
      ))}
    </div>
  )
}
