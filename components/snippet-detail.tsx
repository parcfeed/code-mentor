"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, MessageSquarePlus, ListChecks, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import { UserAvatar } from "@/components/user-avatar"
import { LanguageBadge, DifficultyBadge, RatingStars } from "@/components/meta-badges"
import { CodeReviewViewer, type DraftComment } from "@/components/code-review-viewer"
import { ReviewCard } from "@/components/review-card"
import { RatingInput } from "@/components/rating-input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { Review, Snippet } from "@/lib/types"
import { REVIEW_CHECKLIST } from "@/lib/types"
import { cn, timeAgo } from "@/lib/utils"

export function SnippetDetail({ snippet, reviews }: { snippet: Snippet; reviews: Review[] }) {
  const { data: session } = useSession()
  const isAuthor = session?.user?.id === snippet.author.id
  const hasAlreadyReviewed = reviews.some((r) => r.reviewer.id === session?.user?.id)
  const canReview = !isAuthor && !hasAlreadyReviewed
  const [mode, setMode] = useState<"view" | "review">("view")
  const [drafts, setDrafts] = useState<DraftComment[]>([])
  const [rating, setRating] = useState(0)
  const [summary, setSummary] = useState("")
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  function addDraft(draft: DraftComment) {
    setDrafts((prev) => {
      const others = prev.filter((d) => d.line !== draft.line)
      return [...others, draft].sort((a, b) => a.line - b.line)
    })
  }
  function removeDraft(line: number) {
    setDrafts((prev) => prev.filter((d) => d.line !== line))
  }

  async function submitReview() {
    if (rating === 0) {
      toast.error("Veuillez ajouter une note globale avant de soumettre.")
      return
    }
    if (summary.trim().length < 20) {
      toast.error("Votre résumé doit contenir au moins 20 caractères de feedback constructif.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/snippets/${snippet.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: summary.trim(), rating, drafts }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la soumission de la review")
        return
      }
      toast.success("review soumise ! Vous avez gagné +15 de réputation.", {
        description: `${drafts.length} commentaire${drafts.length > 1 ? "s" : ""} en ligne · ${rating}/5`,
      })
      setMode("view")
      setDrafts([])
      setRating(0)
      setSummary("")
      setChecked({})
    } catch {
      toast.error("Échec de la soumission de la review")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Link href="/snippets" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Retour aux Snippets
      </Link>

      <Card className="mt-2 gap-0 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <LanguageBadge language={snippet.language} />
          <DifficultyBadge difficulty={snippet.difficulty} />
          <Badge variant="outline" className={cn("rounded-md", snippet.status === "open" ? "border-primary/30 bg-primary/10 text-primary" : "text-muted-foreground")}>
            {snippet.status === "open" ? "En attente de review" : "Relu"}
          </Badge>
        </div>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-balance">{snippet.title}</h1>
        <div className="mt-3 flex items-center gap-3">
          <UserAvatar name={snippet.isAnonymous ? "Anonyme" : snippet.author.name} className="size-8" />
          <div>
            <p className="text-sm font-medium">{snippet.isAnonymous ? "Anonyme" : snippet.author.name}</p>
            <p className="text-xs text-muted-foreground">Publié {timeAgo(snippet.createdAt)}</p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{snippet.description}</p>
      </Card>

      <Card className="mt-6 gap-0 overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">
              {mode === "review" ? "Review du snippet" : "Code source"}
            </h2>
            {mode === "review" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Cliquez sur le + à côté d'une ligne pour ajouter un commentaire
              </p>
            )}
          </div>
          {mode === "view" ? (
            canReview ? (
              <Button size="sm" onClick={() => setMode("review")}>
                <MessageSquarePlus className="size-4" /> Écrire une review
              </Button>
            ) : isAuthor ? (
              <span className="text-xs text-muted-foreground">Vous êtes l'auteur de ce snippet</span>
            ) : hasAlreadyReviewed ? (
              <span className="text-xs text-muted-foreground">Vous avez déjà soumis une review</span>
            ) : null
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setMode("view")}>
              Annuler
            </Button>
          )}
        </div>

        <div className="grid items-start gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <CodeReviewViewer
              code={snippet.code}
              language={snippet.language}
              mode={mode}
              existingComments={
                mode === "view"
                  ? reviews
                      .filter((r) => r.reviewer.id === session?.user?.id)
                      .flatMap((r) => r.lineComments)
                  : []
              }
              drafts={drafts}
              onAddDraft={addDraft}
              onRemoveDraft={removeDraft}
            />
          </div>

          <aside className="space-y-4">
            {mode === "review" ? (
              <Card className="gap-0 overflow-hidden p-0">
                <div className="border-b border-border bg-muted/40 px-5 py-3">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <ListChecks className="size-4 text-primary" /> Votre review
                    </h3>
                </div>
                <div className="space-y-5 p-5">
                  <RatingInput value={rating} onChange={setRating} label="Note globale" />
                  <div className="space-y-2">
                    <label htmlFor="summary" className="text-sm font-medium">Résumé du feedback</label>
                    <Textarea id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} placeholder="Qu'ont-ils bien fait ? Que peuvent-ils améliorer ? Soyez précis et bienveillant." />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Checklist de review</p>
                    <ul className="space-y-2">
                      {REVIEW_CHECKLIST.map((item, i) => {
                        const id = `check-${i}`
                        return (
                          <li key={id} className="flex items-start gap-2">
                            <Checkbox id={id} checked={!!checked[id]} onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [id]: !!v }))} className="mt-0.5" />
                            <label htmlFor={id} className="text-sm leading-snug text-muted-foreground">{item}</label>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {drafts.length} commentaire{drafts.length > 1 ? "s" : ""} en ligne ajouté{drafts.length > 1 ? "s" : ""}
                  </div>
                  <Button className="w-full" onClick={submitReview} disabled={submitting}>
                    <Send className="size-4" /> {submitting ? "Soumission..." : "Soumettre la review"}
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <h3 className="text-sm font-semibold">Statistiques</h3>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Reviews</dt>
                      <dd className="font-medium">{snippet.reviewsCount}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Note moyenne</dt>
                      <dd className="flex items-center gap-2 font-medium">
                        {snippet.averageRating > 0 ? <>{snippet.averageRating.toFixed(1)}<RatingStars rating={snippet.averageRating} /></> : <span className="text-muted-foreground">—</span>}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Difficulté</dt>
                      <dd><DifficultyBadge difficulty={snippet.difficulty} /></dd>
                    </div>
                  </dl>
                </Card>
                {canReview && (
                  <Card className="border-primary/30 bg-primary/[0.04] p-5">
                    <h3 className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="size-4 text-primary" /> Gagner en réputation</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Soumettre une review réfléchie vous rapporte <span className="font-medium text-foreground">+15 de réputation</span>.</p>
                  </Card>
                )}
              </>
            )}
          </aside>
        </div>
      </Card>

      {mode === "view" && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold">{reviews.length} Review{reviews.length > 1 ? "s" : ""}</h2>
          {reviews.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-10 text-center">
              <Sparkles className="size-8 text-primary" />
              <p className="font-medium">Pas encore de review</p>
              <p className="max-w-xs text-sm text-muted-foreground">Soyez le premier à aider cet étudiant à progresser.</p>
              {canReview && (
                <Button size="sm" className="mt-2" onClick={() => setMode("review")}>
                  <MessageSquarePlus className="size-4" /> Écrire la première review
                </Button>
              )}
            </Card>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </section>
      )}
    </div>
  )
}
