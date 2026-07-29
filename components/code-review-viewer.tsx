"use client"

import { Plus, MessageSquare, X, Send } from "lucide-react"
import { useState } from "react"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn, timeAgo } from "@/lib/utils"
import type { LineComment } from "@/lib/types"
import { useSession } from "next-auth/react"

export type DraftComment = { line: number; content: string }

export function CodeReviewViewer({
  code,
  existingComments = [],
  mode = "view",
  drafts = [],
  onAddDraft,
  onRemoveDraft,
}: {
  code: string
  existingComments?: LineComment[]
  mode?: "view" | "review"
  drafts?: DraftComment[]
  onAddDraft?: (draft: DraftComment) => void
  onRemoveDraft?: (line: number) => void
}) {
  const lines = code.replace(/\n$/, "").split("\n")
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [text, setText] = useState("")
  const { data: session } = useSession()
  const userName = session?.user?.name ?? "Moi"

  const commentsByLine = existingComments.reduce<Record<number, LineComment[]>>((acc, c) => {
    acc[c.line] = acc[c.line] ? [...acc[c.line], c] : [c]
    return acc
  }, {})
  const draftByLine = new Map(drafts.map((d) => [d.line, d]))

  function openComposer(line: number) {
    setActiveLine(line)
    setText(draftByLine.get(line)?.content ?? "")
  }

  function submit(line: number) {
    if (!text.trim()) return
    onAddDraft?.({ line, content: text.trim() })
    setActiveLine(null)
    setText("")
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card font-mono text-[13px] leading-6">
      {lines.map((line, idx) => {
        const num = idx + 1
        const lineComments = commentsByLine[num] ?? []
        const draft = draftByLine.get(num)
        const isComposing = activeLine === num
        return (
          <div key={num}>
            <div className={cn("group flex items-stretch", (lineComments.length || draft) && "bg-primary/[0.03]")}>
              <span className="relative w-12 shrink-0 select-none border-r border-border/60 pr-2 text-right text-muted-foreground/50">
                {mode === "review" && (
                  <button
                    type="button"
                    onClick={() => openComposer(num)}
                    aria-label={`Ajouter un commentaire sur la ligne ${num}`}
                    className="absolute left-1 top-1/2 hidden size-4 -translate-y-1/2 items-center justify-center rounded bg-primary text-primary-foreground group-hover:flex"
                  >
                    <Plus className="size-3" />
                  </button>
                )}
                {num}
              </span>
              <code className="w-full overflow-x-auto whitespace-pre px-4 text-foreground/90">{line || " "}</code>
            </div>

            {/* Existing comment threads */}
            {lineComments.map((c) => (
              <CommentRow key={c.id} name={c.author.name} content={c.content} time={timeAgo(c.createdAt)} />
            ))}

            {/* Saved draft */}
            {draft && !isComposing && (
              <div className="border-y border-border bg-muted/40 py-3 pl-12 pr-4 font-sans">
                <div className="flex items-start gap-2.5">
                  <UserAvatar name={userName} className="size-6" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{userName}</span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        En attente
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">{draft.content}</p>
                    <div className="mt-1.5 flex gap-3 text-xs">
                      <button type="button" onClick={() => openComposer(num)} className="text-muted-foreground hover:text-foreground">
                        Modifier
                      </button>
                      <button type="button" onClick={() => onRemoveDraft?.(num)} className="text-muted-foreground hover:text-destructive">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Composer */}
            {isComposing && (
              <div className="border-y border-border bg-muted/40 py-3 pl-12 pr-4 font-sans">
                <div className="flex items-start gap-2.5">
                  <UserAvatar name={userName} className="size-6" />
                  <div className="min-w-0 flex-1">
                    <Textarea
                      autoFocus
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`Commentaire sur la ligne ${num}. Soyez précis et constructif...`}
                      rows={3}
                      className="bg-background text-sm"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setActiveLine(null)}>
                        <X className="size-3.5" /> Annuler
                      </Button>
                      <Button type="button" size="sm" onClick={() => submit(num)}>
                        <Send className="size-3.5" /> Ajouter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {mode === "review" && (
        <div className="flex items-center gap-2 border-t border-border bg-muted/30 px-4 py-2.5 font-sans text-xs text-muted-foreground">
          <MessageSquare className="size-3.5" />
          Survolez une ligne et cliquez sur + pour ajouter un commentaire en ligne.
        </div>
      )}
    </div>
  )
}

function CommentRow({ name, content, time }: { name: string; content: string; time: string }) {
  return (
    <div className="border-y border-border bg-muted/40 py-3 pl-12 pr-4 font-sans">
      <div className="flex items-start gap-2.5">
        <UserAvatar name={name} className="size-6" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">{name}</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </div>
          <p className="mt-1 text-sm text-foreground/90">{content}</p>
        </div>
      </div>
    </div>
  )
}
