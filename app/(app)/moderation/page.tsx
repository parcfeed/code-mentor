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
      reporter: { select: { id: true, name: true, username: true, image: true } },
      targetUser: { select: { id: true, name: true, username: true, image: true } },
      snippet: { select: { id: true, isAnonymous: true } },
      review: {
        select: {
          id: true,
          snippet: { select: { id: true, title: true, isAnonymous: true } },
        },
      },
    },
  })
}

async function fetchMetrics() {
  const [totalSnippets, totalReviews, totalUsers, reviewsWithLineComments, firstReviews] = await Promise.all([
    prisma.snippet.count(),
    prisma.review.count(),
    prisma.user.count(),
    prisma.review.count({ where: { lineComments: { some: {} } } }),
    prisma.review.findMany({
      select: { id: true, createdAt: true, snippet: { select: { createdAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const reviewsWithConstructiveFeedback = totalReviews > 0
    ? Math.round((reviewsWithLineComments / totalReviews) * 100)
    : 0

  const reviewsWithTime = firstReviews.filter((r) => r.snippet?.createdAt)
  const totalHours = reviewsWithTime.reduce((sum, r) => {
    const diffMs = r.createdAt.getTime() - new Date(r.snippet.createdAt).getTime()
    return sum + diffMs / (1000 * 60 * 60)
  }, 0)
  const avgTimeToFirstReview = reviewsWithTime.length > 0
    ? Math.round((totalHours / reviewsWithTime.length) * 100) / 100
    : 0

  return {
    totalSnippets,
    totalReviews,
    totalUsers,
    reviewsWithConstructiveFeedback,
    avgTimeToFirstReview,
  }
}

function ErrorView({ message }: { message: string }) {
  return (
    <div>
      <PageHeader
        title="Modération"
        description="Examinez les snippets et reviews signalés pour garder les retours constructifs et respectueux."
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
  let metrics
  try {
    const res = await Promise.all([fetchReports(), fetchMetrics()])
    reports = res[0]
    metrics = res[1]
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("GET /moderation — Prisma query failed:", msg)
    return (
      <ErrorView message={`Erreur DB : ${msg}`} />
    )
  }

  const mapped = reports.map((r) => {
    const isTargetAnonymous = (r.snippet?.isAnonymous ?? r.review?.snippet?.isAnonymous) === true
    return {
      id: r.id,
      reviewSnippet: r.review?.snippet?.title ?? null,
      snippetId: r.review?.snippet?.id ?? r.snippetId ?? null,
      reason: r.reason,
      reporterComment: r.reporterComment ?? null,
      reportedContent: r.reportedContent,
      reporter: { id: r.reporter.id, name: r.reporter.name, username: r.reporter.username, avatar: r.reporter.image ?? "" },
      target: isTargetAnonymous
        ? { id: "", name: "Anonyme", username: "", avatar: "" }
        : { id: r.targetUser.id, name: r.targetUser.name, username: r.targetUser.username, avatar: r.targetUser.image ?? "" },
      createdAt: r.createdAt.toISOString(),
      status: r.status,
      severity: r.severity,
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Modération"
          description="Examinez les snippets et reviews signalés et observez l'état du système."
        />
        <a
          href="/api/moderation/metrics?format=csv"
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Exporter en CSV
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Section A : Performances Réelles */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold">Performances Réelles</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Utilisateurs inscrits</p>
              <p className="text-2xl font-bold">{metrics.totalUsers}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Extraits de code soumis</p>
              <p className="text-2xl font-bold">{metrics.totalSnippets}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reviews constructives</p>
              <p className="text-2xl font-bold">{metrics.reviewsWithConstructiveFeedback}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Temps de feedback moyen</p>
              <p className="text-2xl font-bold">{metrics.avgTimeToFirstReview}h</p>
            </div>
          </div>
        </Card>

        {/* Section B : Objectifs du Cahier des Charges */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold">Objectifs du Cahier des Charges</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Cible : 500 soumissions (2 mois)</p>
              <p className="text-2xl font-bold">{metrics.totalSnippets} / 500</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cible : 80% reviews constructives</p>
              <p className="text-2xl font-bold">{metrics.reviewsWithConstructiveFeedback}% / 80%</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Cible : Temps d'obtention de feedback</p>
              <p className="text-sm font-semibold mt-1">
                {metrics.avgTimeToFirstReview}h <span className="text-muted-foreground font-normal">(objectif cible : réduction de 25%)</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">File de modération</h2>
        <ModerationQueue initialReports={mapped} />
      </div>
    </div>
  )
}
