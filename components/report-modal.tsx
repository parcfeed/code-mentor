"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const REPORT_REASONS = [
  "Feedback non constructif",
  "Contenu offensant ou irrespectueux",
  "Contenu inapproprié",
  "Spam",
  "Autre",
]

interface ReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId: string
  snippetId: string
}

export function ReportModal({ open, onOpenChange, reviewId, snippetId }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [comment, setComment] = useState("")
  const [sending, setSending] = useState(false)

  function handleClose() {
    onOpenChange(false)
    setSelectedReason(null)
    setComment("")
  }

  async function handleSubmit() {
    if (!selectedReason || sending) return

    setSending(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          reason: selectedReason,
          reporterComment: comment.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec du signalement")
        return
      }
      toast.success("Signalement envoyé. Merci pour votre retour.")
      handleClose()
    } catch {
      toast.error("Échec du signalement")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-4 text-destructive" />
            Signaler cette review
          </DialogTitle>
          <DialogDescription>
            Pourquoi souhaitez-vous signaler cette review ?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="Raison du signalement">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              role="radio"
              aria-checked={selectedReason === reason}
              onClick={() => setSelectedReason(reason)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-left text-sm transition-colors",
                "hover:bg-muted/50",
                selectedReason === reason
                  ? "border-primary bg-primary/5 text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  selectedReason === reason
                    ? "border-primary"
                    : "border-muted-foreground/40"
                )}
              >
                {selectedReason === reason && (
                  <span className="size-2 rounded-full bg-primary" />
                )}
              </span>
              {reason}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-comment">Précision (facultatif)</Label>
          <Textarea
            id="report-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Expliquez brièvement votre signalement..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason || sending}
          >
            {sending ? "Envoi..." : "Envoyer le signalement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
