"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function RatingInput({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (value: number) => void
  label: string
}) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hover || value)
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(star)}
              className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star
                className={cn(
                  "size-5 transition-colors",
                  active ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
