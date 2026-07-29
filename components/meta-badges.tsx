import { Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Difficulty, Language } from "@/lib/types"
import { languageColors } from "@/lib/types"

export function LanguageBadge({ language }: { language: Language }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: languageColors[language] }}
        aria-hidden
      />
      {language}
    </span>
  )
}

const difficultyStyles: Record<Difficulty, string> = {
  Beginner: "border-primary/30 bg-primary/10 text-primary",
  Intermediate: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Advanced: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <Badge variant="outline" className={cn("rounded-md font-medium", difficultyStyles[difficulty])}>
      {difficulty}
    </Badge>
  )
}

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`Note ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  )
}
