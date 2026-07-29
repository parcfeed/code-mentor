import { prisma } from "@/lib/prisma"
import { successResponse, notFound, internalError } from "@/lib/api-response"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        reputation: true,
        level: true,
        levelTitle: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: "desc" },
        },
        _count: { select: { reviews: true, snippets: true } },
      },
    })

    if (!user) return notFound("Utilisateur introuvable")

    // Historique des votes reçus sur ses reviews (indicateur de qualité)
    const reviewVoteStats = await prisma.reviewVote.groupBy({
      by: ["kind"],
      where: { review: { reviewerId: user.id } },
      _count: true,
    })

    const upvotesReceived = reviewVoteStats.find((v) => v.kind === "up")?._count ?? 0
    const downvotesReceived = reviewVoteStats.find((v) => v.kind === "down")?._count ?? 0

    return successResponse({
      id: user.id,
      username: user.username,
      reputation: user.reputation,
      level: user.level,
      levelTitle: user.levelTitle,
      reviewsGiven: user._count.reviews,
      snippetsSubmitted: user._count.snippets,
      upvotesReceived,
      downvotesReceived,
      badges: user.badges.map((ub) => ({
        id: ub.badge.id,
        label: ub.badge.label,
        description: ub.badge.description,
        tone: ub.badge.tone,
        earnedAt: ub.earnedAt.toISOString(),
      })),
    })
  } catch (e) {
    console.error("GET /api/users/[username]/reputation", e)
    return internalError()
  }
}
