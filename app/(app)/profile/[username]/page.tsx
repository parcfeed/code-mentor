import { notFound } from "next/navigation"
import { Calendar, Code2, MessageSquare, Star, TrendingUp } from "lucide-react"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { UserAvatar } from "@/components/user-avatar"
import { BadgeChip } from "@/components/badge-chip"
import { SnippetCard } from "@/components/snippet-card"
import { ReviewCard } from "@/components/review-card"
import { ProfileBackButton } from "@/components/profile-back-button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const session = await getServerSession(authOptions)

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      reputation: true,
      level: true,
      levelTitle: true,
      bio: true,
      joinedAt: true,
      _count: { select: { snippets: true, reviews: true } },
      badges: {
        include: { badge: true },
        orderBy: { earnedAt: "desc" },
      },
      snippets: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          snippet: { select: { id: true, title: true } },
          reviewer: { select: { id: true, name: true, username: true, image: true, reputation: true } },
          lineComments: true,
          votes: true,
        },
      },
    },
  })

  if (!user) notFound()

  const isOwner = session?.user?.id === user.id
  const visibleSnippets = isOwner
    ? user.snippets
    : user.snippets.filter((s) => !s.isAnonymous)

  const repInLevel = user.reputation % 500
  const repToNext = repInLevel === 0 ? 0 : 500 - repInLevel

  const stats = [
    { label: "Réputation", value: user.reputation.toLocaleString(), icon: Star },
    { label: "Reviews",    value: user._count.reviews,              icon: MessageSquare },
    { label: "Snippets",   value: user._count.snippets,             icon: Code2 },
    { label: "Niveau",     value: user.level,                       icon: TrendingUp },
  ]

  const profileBadges = user.badges.map((ub) => ({
    id: ub.badge.id,
    label: ub.badge.label,
    description: ub.badge.description,
    tone: ub.badge.tone,
  }))

  const userSnippets = visibleSnippets.map((s) => ({
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

  const userReviews = user.reviews.map((r) => ({
    id: r.id,
    snippetId: r.snippetId,
    snippetTitle: r.snippet.title,
    reviewer: r.reviewer,
    summary: r.summary,
    rating: r.rating,
    upvotes: r.votes.filter((v) => v.kind === "up").length,
    downvotes: r.votes.filter((v) => v.kind === "down").length,
    createdAt: r.createdAt.toISOString(),
    lineComments: r.lineComments.map((lc) => ({
      id: lc.id,
      line: lc.lineNumber,
      author: { id: r.reviewer.id, name: r.reviewer.name, avatar: r.reviewer.image ?? "" },
      content: lc.content,
      createdAt: lc.createdAt.toISOString(),
    })),
  }))

  return (
    <div className="space-y-6">
      {!isOwner && <ProfileBackButton />}
      <Card className="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <UserAvatar name={user.name} className="size-20 text-2xl" image={user.image} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {user.levelTitle}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/90 text-pretty">{user.bio}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              Inscrit{" "}
              {user.joinedAt.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Niveau {user.level}</span>
            <span className="text-muted-foreground">{repToNext} rép. pour le niveau {user.level + 1}</span>
          </div>
          <Progress value={user.level > 0 ? (repInLevel / 500) * 100 : 0} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="gap-1 p-4">
              <Icon className="size-4 text-primary" />
              <span className="text-2xl font-semibold tabular-nums">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </Card>
          )
        })}
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold">Badges obtenus</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {profileBadges.map((b) => (
            <BadgeChip key={b.id} badge={b} />
          ))}
        </div>
      </Card>

      <Tabs defaultValue="snippets">
        <TabsList>
          <TabsTrigger value="snippets">Snippets ({userSnippets.length})</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="snippets" className="mt-4">
          {userSnippets.length === 0 ? (
            <EmptyState text="Aucun snippet public pour l'instant." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userSnippets.map((s) => (
                <SnippetCard key={s.id} snippet={s} isEditable={isOwner} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4 space-y-4">
          {userReviews.length === 0 ? (
            <EmptyState text="Aucune review pour l'instant." />
          ) : (
            userReviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="p-10 text-center text-sm text-muted-foreground">{text}</Card>
  )
}