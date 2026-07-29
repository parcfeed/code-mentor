import { prisma } from "@/lib/prisma"
import { successResponse, notFound, internalError } from "@/lib/api-response"

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params
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
          where: { isAnonymous: false },
          orderBy: { createdAt: "desc" },
          include: {
            author: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: { select: { id: true, name: true, username: true, image: true, reputation: true } },
            lineComments: true,
            votes: true,
          },
        },
      },
    })

    if (!user) return notFound("Utilisateur introuvable")

    const mapped = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.image,
      reputation: user.reputation,
      level: user.level,
      levelTitle: user.levelTitle,
      bio: user.bio,
      joinedAt: user.joinedAt.toISOString(),
      snippetsCount: user._count.snippets,
      reviewsCount: user._count.reviews,
      badges: user.badges.map((ub) => ({
        id: ub.badge.id,
        label: ub.badge.label,
        description: ub.badge.description,
        tone: ub.badge.tone,
      })),
      snippets: user.snippets.map((s) => ({
        id: s.id,
        title: s.title,
        code: s.code,
        language: s.language,
        difficulty: s.difficulty,
        isAnonymous: s.isAnonymous,
        description: s.description,
        createdAt: s.createdAt.toISOString(),
        reviewsCount: s.reviewsCount,
        averageRating: Number(s.averageRating),
        status: s.status,
        author: s.author,
      })),
      reviews: user.reviews.map((r) => ({
        id: r.id,
        snippetId: r.snippetId,
        reviewer: r.reviewer,
        summary: r.summary,
        rating: r.rating,
        createdAt: r.createdAt.toISOString(),
        upvotes: r.votes.filter((v) => v.kind === "up").length,
        downvotes: r.votes.filter((v) => v.kind === "down").length,
        lineComments: r.lineComments.map((lc) => ({
          id: lc.id,
          line: lc.lineNumber,
          content: lc.content,
          createdAt: lc.createdAt.toISOString(),
        })),
      })),
    }

    return successResponse(mapped)
  } catch (e) {
    console.error("GET /api/users/[username]", e)
    return internalError()
  }
}