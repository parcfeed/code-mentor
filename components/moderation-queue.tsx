"use client"

import { useState } from "react"
import { Check, X, ShieldAlert, Flag } from "lucide-react"
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
  reviewSnippet: string
  reason: string
  reportedContent: string
  reporter: { id: string; name: string; avatar: string }
  target: { id: string; name: string; avatar: string }
  createdAt: string
  status: "pending" | "resolved" | "dismissed"
  severity: "low" | "medium" | "high"
}

const severityStyles: Record<string, string> = {
  low: "border-border bg-muted text-muted-foreground",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
}

export function ModerationQueue({ initialReports }: { initialReports: ReportItem[] }) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState<"all" | ReportItem["status"]>("all")

  async function resolve(id: string, status: "resolved" | "dismissed") {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la mise à jour du signalement")
        return
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)))
      toast.success(status === "resolved" ? "Signalement résolu et contenu supprimé." : "Signalement rejeté.")
    } catch {
      toast.error("Échec de la mise à jour du signalement")
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
        filtered.map((report) => (
          <Card key={report.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Flag className="size-4 text-destructive" />
                <span className="font-medium">{report.reason}</span>
                <Badge variant="outline" className={cn("rounded-md capitalize", severityStyles[report.severity])}>
                  {report.severity}
                </Badge>
                {report.status !== "pending" && (
                  <Badge variant="outline" className="rounded-md capitalize text-muted-foreground">{report.status}</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo(report.createdAt)}</span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Sur l'Snippet : <span className="font-medium text-foreground">{report.reviewSnippet}</span>
            </p>

            <blockquote className="mt-3 rounded-lg border-l-2 border-destructive/40 bg-muted/40 px-4 py-3 text-sm italic text-foreground/90">
              &ldquo;{report.reportedContent}&rdquo;
            </blockquote>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <UserAvatar name={report.reporter.name} className="size-5" />
                  Signalé par {report.reporter.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <UserAvatar name={report.target.name} className="size-5" />
                  Contre {report.target.name}
                </span>
              </div>

              {report.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resolve(report.id, "dismissed")}>
                    <X className="size-4" /> Rejeter
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => resolve(report.id, "resolved")}>
                    <Check className="size-4" /> Supprimer le contenu
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}