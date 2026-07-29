import { MessageSquare, EyeOff } from "lucide-react"
import Link from "next/link"
import { DifficultyBadge, LanguageBadge, RatingStars } from "@/components/meta-badges"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import type { Snippet } from "@/lib/types"
import { timeAgo } from "@/lib/utils"

export function SnippetCard({ snippet }: { snippet: Snippet }) {
  const authorName = snippet.isAnonymous ? "Anonyme" : snippet.author.name

  return (
    <Link href={`/snippets/${snippet.id}`} className="group block">
      <Card className="h-full gap-0 p-5 transition-all hover:ring-primary/40 hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <LanguageBadge language={snippet.language} />
            <span className="text-muted-foreground/40">·</span>
            <DifficultyBadge difficulty={snippet.difficulty} />
          </div>
          {snippet.status === "open" ? (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              À relire
            </span>
          ) : (
            <RatingStars rating={snippet.averageRating} />
          )}
        </div>

        <h3 className="mt-3 text-balance font-medium leading-snug transition-colors group-hover:text-primary">
          {snippet.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet.description}</p>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {snippet.isAnonymous ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <EyeOff className="size-3" />
              </span>
            ) : (
              <UserAvatar name={authorName} className="size-6" />
            )}
            <span className="text-xs text-muted-foreground">
              {authorName} · {timeAgo(snippet.createdAt)}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="size-3.5" />
            {snippet.reviewsCount}
          </span>
        </div>
      </Card>
    </Link>
  )
}
