import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { ModerationQueue } from "@/components/moderation-queue"
import { Card } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

async function fetchReports() {
  return prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { id: true, name: true, image: true } },
      targetUser: { select: { id: true, name: true, image: true } },
      review: { select: { id: true, snippet: { select: { title: true } } } },
    },
  })
}

function ErrorView({ message }: { message: string }) {
  return (
    <div>
      <PageHeader
        title="Modération"
        description="Examinez les Snippets et Reviews signalés pour garder les retours constructifs et respectueux."
      />
      <Card className="flex flex-col items-center gap-2 p-12 text-center">
        <ShieldAlert className="size-8 text-destructive" />
        <p className="font-medium">Erreur de chargement</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </Card>
    </div>
  )
}

export default async function ModerationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "moderator") {
    redirect("/login")
  }

  let reports
  try {
    reports = await fetchReports()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("GET /moderation — Prisma query failed:", msg)
    return (
      <ErrorView message={`Erreur DB : ${msg}`} />
    )
  }

  const mapped = reports.map((r) => ({
    id: r.id,
    reviewSnippet: r.review?.snippet?.title ?? "Snippet inconnu",
    reason: r.reason,
    reportedContent: r.reportedContent,
    reporter: { id: r.reporter.id, name: r.reporter.name, avatar: r.reporter.image ?? "" },
    target: { id: r.targetUser.id, name: r.targetUser.name, avatar: r.targetUser.image ?? "" },
    createdAt: r.createdAt.toISOString(),
    status: r.status,
    severity: r.severity,
  }))

  return (
    <div>
      <PageHeader
        title="Modération"
        description="Examinez les Snippets et Reviews signalés pour garder les retours constructifs et respectueux."
      />
      <ModerationQueue initialReports={mapped} />
    </div>
  )
}
