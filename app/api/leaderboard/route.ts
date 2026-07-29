import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { successResponse, internalError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const language = searchParams.get("language")
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")))

    // Filtre par langage : on sélectionne les users ayant reviewé des snippets dans ce langage
    if (language && language !== "all") {
      // Récupérer les reviewerId actifs sur ce langage, triés par nombre de reviews
      const reviewsByLang = await prisma.review.groupBy({
        by: ["reviewerId"],
        where: { snippet: { language: { equals: language, mode: "insensitive" } } },
        _count: { reviewerId: true },
        orderBy: { _count: { reviewerId: "desc" } },
        take: limit,
      })

      if (reviewsByLang.length === 0) {
        return successResponse([])
      }

      const userIds = reviewsByLang.map((r) => r.reviewerId)
      const reviewCountByUser = Object.fromEntries(
        reviewsByLang.map((r) => [r.reviewerId, r._count.reviewerId])
      )

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
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
        },
      })

      // Trier dans l'ordre retourné par groupBy (nb de reviews sur ce langage)
      users.sort(
        (a, b) => (reviewCountByUser[b.id] ?? 0) - (reviewCountByUser[a.id] ?? 0)
      )

      const mapped = users.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        avatar: u.image,
        reputation: u.reputation,
        level: u.level,
        levelTitle: u.levelTitle,
        bio: u.bio,
        joinedAt: u.joinedAt.toISOString(),
        snippetsCount: u._count.snippets,
        reviewsCount: u._count.reviews,
        reviewsInLanguage: reviewCountByUser[u.id] ?? 0,
        badges: u.badges.map((ub) => ({
          id: ub.badge.id,
          label: ub.badge.label,
          description: ub.badge.description,
          tone: ub.badge.tone,
        })),
      }))

      return successResponse(mapped)
    }

    // Leaderboard global (comportement original)
    const users = await prisma.user.findMany({
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
      },
      orderBy: { reputation: "desc" },
      take: limit,
    })

    const mapped = users.map((u) => ({
      id: u.id,
      name: u.name,
      username: u.username,
      avatar: u.image,
      reputation: u.reputation,
      level: u.level,
      levelTitle: u.levelTitle,
      bio: u.bio,
      joinedAt: u.joinedAt.toISOString(),
      snippetsCount: u._count.snippets,
      reviewsCount: u._count.reviews,
      badges: u.badges.map((ub) => ({
        id: ub.badge.id,
        label: ub.badge.label,
        description: ub.badge.description,
        tone: ub.badge.tone,
      })),
    }))

    return successResponse(mapped)
  } catch (e) {
    console.error("GET /api/leaderboard", e)
    return internalError()
  }
}