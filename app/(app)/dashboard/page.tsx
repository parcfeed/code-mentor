import { Code2, MessageSquareCode, Star, TrendingUp, ArrowRight, Award, GitPullRequestArrow } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { SnippetCard } from "@/components/snippet-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { timeAgo } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      reputation: true,
      level: true,
      levelTitle: true,
      _count: { select: { snippets: true, reviews: true } },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
    },
  })

  if (!user) redirect("/login")

  // Snippets les plus récents à reviewer — on exclut ceux de l'utilisateur courant et ceux qu'il a déjà reviewés
  const openSnippets = await prisma.snippet.findMany({
    where: {
      status: "open",
      authorId: { not: user.id },
      NOT: {
        reviews: {
          some: { reviewerId: user.id },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
    },
  })

  // Activité récente : reviews reçues (sur mes snippets) + reviews données (sur les snippets des autres)
  const recentActivityData = await prisma.review.findMany({
    where: {
      OR: [{ snippet: { authorId: user.id } }, { reviewerId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
      snippet: { select: { title: true } },
    },
  })

  // Note moyenne réelle des reviews données par l'utilisateur
  const avgRatingResult = await prisma.review.aggregate({
    where: { reviewerId: user.id },
    _avg: { rating: true },
  })
  const avgRating = avgRatingResult._avg.rating
    ? avgRatingResult._avg.rating.toFixed(1)
    : "—"

  const toReview = openSnippets.map((s) => ({
    id: s.id,
    title: s.title,
    code: s.code,
    language: s.language,
    difficulty: s.difficulty,
    isAnonymous: s.isAnonymous,
    author: s.isAnonymous ? { id: "", name: "Anonyme", username: "", image: null } : s.author,
    createdAt: s.createdAt.toISOString(),
    reviewsCount: s.reviewsCount,
    averageRating: Number(s.averageRating),
    status: s.status,
    description: s.description,
  }))

  const activity = recentActivityData.map((r) => {
    const isSelf = r.reviewer.id === user.id
    return {
      id: r.id,
      isSelf,
      actor: { id: r.reviewer.id, name: r.reviewer.name, avatar: r.reviewer.image ?? "" },
      text: isSelf ? "Vous avez fait une review de" : "a fait une review de",
      target: r.snippet.title,
      createdAt: r.createdAt.toISOString(),
    }
  })

  const repInLevel = user.reputation % 500
  const repToNext = 500 - repInLevel
  const nextLevel = user.level + 1
  const xpProgress = (repInLevel / 500) * 100

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Bon retour, ${user.name.split(" ")[0]}`}
        description="Voici ce qui se passe dans votre communauté aujourd'hui."
        action={
          <Button render={<Link href="/snippets/new" />}>Nouvel Snippet</Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="gap-0 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Réputation</span>
            <TrendingUp className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{user.reputation.toLocaleString()}</p>
          <p className="mt-1 text-xs text-muted-foreground">Niveau {user.level} — {user.levelTitle}</p>
        </Card>
        <Card className="gap-0 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reviews données</span>
            <MessageSquareCode className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{user._count.reviews}</p>
          <p className="mt-1 text-xs text-muted-foreground">au total</p>
        </Card>
        <Card className="gap-0 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Snippets publiés</span>
            <Code2 className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{user._count.snippets}</p>
          <p className="mt-1 text-xs text-muted-foreground">au total</p>
        </Card>
        <Card className="gap-0 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Note moyenne</span>
            <Star className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{avgRating}</p>
          <p className="mt-1 text-xs text-muted-foreground">sur vos reviews</p>
        </Card>
      </div>

      {/* Layout 2 colonnes : snippets à gauche, sidebar à droite */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Colonne principale : snippets */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Snippets à reviewer</h2>
            <Button render={<Link href="/snippets" />} variant="ghost" size="sm">
              Voir tout <ArrowRight className="size-4" />
            </Button>
          </div>

          {toReview.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {toReview.map((s) => <SnippetCard key={s.id} snippet={s} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun snippet en attente de review.</p>
          )}
        </div>

        {/* Sidebar droite : niveau + activité */}
        <div className="space-y-6">
          <Card className="gap-0 p-5">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                {user.level}
              </span>
              <div>
                <p className="text-sm font-medium">{user.levelTitle}</p>
                <p className="text-xs text-muted-foreground">Niveau {user.level}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>{user.reputation.toLocaleString()} XP</span>
                <span>{((Math.floor(user.reputation / 500) + 1) * 500).toLocaleString()} XP</span>
              </div>
              <Progress value={xpProgress} />
              <p className="mt-2 text-xs text-muted-foreground">{repToNext} XP pour atteindre le niveau {nextLevel}</p>
            </div>
          </Card>

          <Card className="gap-0 p-5">
            <h2 className="font-medium">Activité récente</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {activity.length > 0 ? (
                activity.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <GitPullRequestArrow className="size-3.5" />
                    </span>
                    <div className="text-sm leading-snug">
                      {a.isSelf ? (
                        <span className="text-muted-foreground">{a.text}</span>
                      ) : (
                        <>
                          <span className="font-medium">{a.actor.name}</span>{" "}
                          <span className="text-muted-foreground">{a.text}</span>
                        </>
                      )}{" "}
                      <span className="font-medium">{a.target}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
