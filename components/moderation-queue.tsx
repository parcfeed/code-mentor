"use client"

import { useState } from "react"
import { Check, X, ShieldAlert, Flag, ExternalLink, Eye, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { timeAgo } from "@/lib/utils"

type ReportItem = {
  id: string
  reviewSnippet: string | null
  snippetId: string | null
  reason: string
  reporterComment: string | null
  reportedContent: string
  reporter: { id: string; name: string; avatar: string; username?: string }
  target: { id: string; name: string; avatar: string; username?: string }
  createdAt: string
  status: "pending" | "resolved" | "dismissed"
  severity: "low" | "medium" | "high"
}

const severityStyles: Record<string, string> = {
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

const statusStyles: Record<string, string> = {
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  dismissed: "border-slate-400/40 bg-slate-400/10 text-slate-500 dark:text-slate-400",
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  resolved: "Résolu",
  dismissed: "Rejeté",
}

const severityLabels: Record<string, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
}

export function ModerationQueue({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<"all" | ReportItem["status"]>("all")
  const [revealedAuthors, setRevealedAuthors] = useState<
    Record<string, { name: string; username: string }>
  >({})
  const [revealing, setRevealing] = useState<string | null>(null)

  async function resolve(
    id: string,
    status: "resolved" | "dismissed",
    deleteContent = false,
    applySanction = false
  ) {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, deleteContent, applySanction }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la mise à jour du signalement")
        return
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast.success(
        status === "resolved"
          ? (deleteContent ? "Signalement résolu et contenu supprimé." : "Signalement résolu sans suppression.")
          : "Signalement rejeté."
      )
    } catch {
      toast.error("Échec de la mise à jour du signalement")
    }
  }

  async function revealAuthor(snippetId: string) {
    setRevealing(snippetId)
    try {
      const res = await fetch(`/api/moderation/snippets/${snippetId}/reveal`)
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Impossible de révéler l'auteur")
        return
      }
      setRevealedAuthors((prev) => ({
        ...prev,
        [snippetId]: { name: json.data.author.name, username: json.data.author.username },
      }))
      toast.success("Auteur révélé.")
    } catch {
      toast.error("Erreur lors de la révélation de l'auteur")
    } finally {
      setRevealing(null)
    }
  }

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter)
  const pendingCount = reports.filter((r) => r.status === "pending").length

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Tous ({reports.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pendingCount})</TabsTrigger>
          <TabsTrigger value="resolved">Résolus</TabsTrigger>
          <TabsTrigger value="dismissed">Rejetés</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-12 text-center">
          <ShieldAlert className="size-8 text-primary" />
          <p className="font-medium">Rien ici</p>
          <p className="text-sm text-muted-foreground">Aucun signalement ne correspond à ce filtre.</p>
        </Card>
      ) : (
        filtered.map((report) => {
          const targetInfo = revealedAuthors[report.snippetId ?? ""] || report.target
          return (
            <Card key={report.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Flag className="size-4 text-destructive" />
                  <span className="font-medium">{report.reason}</span>
                  <Badge variant="outline" className={cn("rounded-md", severityStyles[report.severity])}>
                    {severityLabels[report.severity] ?? report.severity}
                  </Badge>
                  <Badge variant="outline" className={cn("rounded-md", statusStyles[report.status])}>
                    {statusLabels[report.status] ?? report.status}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(report.createdAt)}</span>
              </div>

              {report.reviewSnippet && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Relecture pour :{" "}
                  <span className="font-medium text-foreground">{report.reviewSnippet}</span>
                  {report.snippetId && (
                    <Link
                      href={`/snippets/${report.snippetId}`}
                      className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Voir le snippet <ExternalLink className="size-3" />
                    </Link>
                  )}
                </p>
              )}

              <blockquote className="mt-3 rounded-lg border-l-2 border-destructive/40 bg-muted/40 px-4 py-3 text-sm italic text-foreground/90">
                &ldquo;{report.reportedContent}&rdquo;
              </blockquote>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <Link
                    href={report.reporter.username ? `/profile/${report.reporter.username}` : "#"}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <UserAvatar name={report.reporter.name} className="size-5" />
                    Signalé par <span className="font-medium text-foreground">{report.reporter.name}</span>
                  </Link>

                  {targetInfo.name === "Anonyme" ? (
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserAvatar name="Anonyme" className="size-5" />
                        Contre <span className="font-medium text-foreground">Anonyme</span>
                      </span>
                      {report.status === "pending" && report.snippetId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-xs text-primary hover:text-primary/80"
                          onClick={() => revealAuthor(report.snippetId!)}
                          disabled={revealing === report.snippetId}
                        >
                          {revealing === report.snippetId ? "Révélation..." : "Révéler l'auteur"}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={targetInfo.username ? `/profile/${targetInfo.username}` : "#"}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <UserAvatar name={targetInfo.name} className="size-5" />
                      Contre <span className="font-medium text-foreground">{targetInfo.name}</span>
                    </Link>
                  )}
                </div>

                {report.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolve(report.id, "dismissed", false, false)}>
                      <X className="size-4" /> Rejeter
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => resolve(report.id, "resolved", true, true)}>
                      <Check className="size-4" /> Supprimer le contenu
                    </Button>
                  </div>
                )}
              </div>

              {report.reporterComment && (
                <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-xs font-medium text-muted-foreground">Précision du signalement :</p>
                  <p className="mt-1 text-sm text-foreground/90">&ldquo;{report.reporterComment}&rdquo;</p>
                </div>
              )}
            </Card>
          )
        })
      )}
    </div>
  )
}
