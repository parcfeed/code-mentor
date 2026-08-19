import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModerator } from "@/lib/auth-guards"
import { successResponse, validationError, notFound, internalError } from "@/lib/api-response"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireModerator()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { status } = body

    if (!status || !["resolved", "dismissed"].includes(status)) {
      return validationError("Le statut doit être 'resolved' ou 'dismissed'")
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return notFound("Signalement introuvable")

    // Si résolution : supprimer la review signalée et recalculer les stats du snippet
    if (status === "resolved" && report.reviewId) {
      const review = await prisma.review.findUnique({
        where: { id: report.reviewId },
        select: { id: true, snippetId: true, reviewerId: true },
      })

      if (review) {
        await prisma.review.delete({ where: { id: review.id } })

        // Recalculer reviewsCount et averageRating du snippet
        const [count, avg] = await Promise.all([
          prisma.review.count({ where: { snippetId: review.snippetId } }),
          prisma.review.aggregate({ where: { snippetId: review.snippetId }, _avg: { rating: true } }),
        ])

        await prisma.snippet.update({
          where: { id: review.snippetId },
          data: {
            reviewsCount: count,
            averageRating: (avg._avg.rating ?? 0).toFixed(2),
            status: count === 0 ? "open" : "reviewed",
          },
        })
      }
    }

    const updated = await prisma.report.update({
      where: { id },
      data: { status, resolvedAt: status === "resolved" ? new Date() : null },
    })

    return successResponse(updated)
  } catch (e) {
    console.error("PATCH /api/reports/[id]", e)
    return internalError()
  }
}