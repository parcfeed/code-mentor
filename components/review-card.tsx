"use client"
 
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowBigUp, ArrowBigDown, MessageSquare, Flag, Code2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { RatingStars } from "@/components/meta-badges"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Review } from "@/lib/types"
import { timeAgo } from "@/lib/utils"
import { ReportModal } from "@/components/report-modal"

export function ReviewCard({ review }: { review: Review }) {
  const router = useRouter()
  const { data: session } = useSession()
  const isOwn = session?.user?.id === review.reviewer.id
  const [vote, setVote] = useState<"up" | "down" | null>(null)
  const [score, setScore] = useState(review.upvotes - review.downvotes)
  const [reportOpen, setReportOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleVote(kind: "up" | "down") {
    const newVote = vote === kind ? null : kind
    const delta = newVote === null
      ? (kind === "up" ? -1 : 1)
      : (kind === "up"
          ? (vote === "down" ? 2 : 1)
          : (vote === "up" ? -2 : -1))

    setVote(newVote)
    setScore((prev) => prev + delta)

    try {
      await fetch(`/api/snippets/${review.snippetId}/reviews/${review.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      })
    } catch {
      setVote(vote)
      setScore((prev) => prev - delta)
    }
  }

  async function handleDeleteReview() {
    if (!confirm("Voulez-vous vraiment supprimer votre relecture ?")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/snippets/${review.snippetId}/reviews/${review.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la suppression de la relecture")
        return
      }
      toast.success("Relecture supprimée.")
      router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <article className="rounded-xl border border-border bg-card p-5">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              name={review.reviewer.name}
              className="size-9"
              username={review.reviewer.username}
            />
            <div>
              <Link href={`/profile/${review.reviewer.username}`} className="text-sm font-medium hover:text-primary">
                {review.reviewer.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{review.reviewer.reputation.toLocaleString()} rép.</span>
                <span aria-hidden>·</span>
                <span>{timeAgo(review.createdAt)}</span>
              </div>
            </div>
          </div>
          <RatingStars rating={review.rating} />
        </header>

        {review.snippetTitle && (
          <Link
            href={`/snippets/${review.snippetId}`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Code2 className="size-3.5" />
            {review.snippetTitle}
          </Link>
        )}

        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{review.summary}</p>

        {review.lineComments.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquare className="size-3.5" />
              {review.lineComments.length} commentaire{review.lineComments.length > 1 ? "s" : ""} en ligne
            </p>
            <ul className="space-y-2">
              {review.lineComments.map((c) => (
                <li key={c.id} className="flex gap-2 text-sm">
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">L{c.line}</span>
                  <span className="text-foreground/80">{c.content}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="mt-4 flex items-center gap-1">
          <div className="flex items-center rounded-lg border border-border">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Vote positif"
              onClick={() => handleVote("up")}
              className={cn("h-8 rounded-r-none px-2", vote === "up" && "text-primary")}
            >
              <ArrowBigUp className={cn("size-4", vote === "up" && "fill-primary")} />
            </Button>
            <span className="min-w-8 text-center text-sm font-medium tabular-nums">{score}</span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Vote négatif"
              onClick={() => handleVote("down")}
              className={cn("h-8 rounded-l-none px-2", vote === "down" && "text-destructive")}
            >
              <ArrowBigDown className={cn("size-4", vote === "down" && "fill-destructive")} />
            </Button>
          </div>
          {!isOwn ? (
            <Button variant="ghost" size="sm" className="ml-auto h-8 text-muted-foreground hover:text-destructive" onClick={() => setReportOpen(true)}>
              <Flag className="size-3.5" /> Signaler
            </Button>
          ) : (
            <Button variant="ghost" size="sm" disabled={deleting} className="ml-auto h-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteReview}>
              Supprimer
            </Button>
          )}
        </footer>
      </article>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        reviewId={review.id}
        snippetId={review.snippetId}
      />
    </>
  )
}
