import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModerator } from "@/lib/auth-guards"
import { successResponse, internalError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const { session, error } = await requireModerator()
    if (error) return error

    const format = new URL(req.url).searchParams.get("format")

    const [totalSnippets, totalReviews, totalUsers, reviewsWithLineComments, snippets, firstReviews] = await Promise.all([
      prisma.snippet.count(),
      prisma.review.count(),
      prisma.user.count(),
      prisma.review.count({ where: { lineComments: { some: {} } } }),
      prisma.snippet.groupBy({ by: ["language"], _count: true }),
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

    const difficultyRaw = await prisma.snippet.groupBy({
      by: ["difficulty"],
      _count: true,
    })
    const snippetsByDifficulty = Object.fromEntries(
      difficultyRaw.map((d) => [d.difficulty, d._count])
    )

    const snippetsByLanguage = Object.fromEntries(
      snippets.map((s) => [s.language, s._count])
    )

    const metrics = {
      totalSnippets,
      totalReviews,
      totalUsers,
      reviewsWithConstructiveFeedback,
      avgTimeToFirstReview,
      snippetsByLanguage,
      snippetsByDifficulty,
    }

    if (format === "csv") {
      const rid = crypto.randomUUID()
      const headers = ["metric", "value"]
      const meta = [`# Generated at: ${new Date().toISOString()}`, `# requestId: ${rid}`]
      const rows = [
        ["totalSnippets", String(totalSnippets)],
        ["totalReviews", String(totalReviews)],
        ["totalUsers", String(totalUsers)],
        ["reviewsWithConstructiveFeedback", `${reviewsWithConstructiveFeedback}%`],
        ["avgTimeToFirstReview", `${avgTimeToFirstReview}h`],
        ...Object.entries(snippetsByLanguage).map(([k, v]) => [`snippets_language_${k}`, String(v)]),
        ...Object.entries(snippetsByDifficulty).map(([k, v]) => [`snippets_difficulty_${k}`, String(v)]),
      ]
      const csv = [...meta, headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
      return new Response(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=metrics.csv",
        },
      })
    }

    return successResponse(metrics)
  } catch (e) {
    console.error("GET /api/moderation/metrics", e)
    return internalError()
  }
}
