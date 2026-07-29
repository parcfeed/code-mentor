import { Award } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Badge as BadgeType } from "@/lib/types"

export function BadgeChip({ badge }: { badge: BadgeType }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          badge.tone === "emerald"
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        <Award className="size-3.5" />
        {badge.label}
      </TooltipTrigger>
      <TooltipContent>{badge.description}</TooltipContent>
    </Tooltip>
  )
}
