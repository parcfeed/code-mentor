import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, notFound, forbidden, internalError } from "@/lib/api-response"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id: snippetId, reviewId } = await params

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reviewerId: true, snippetId: true, rating: true },
    })

    if (!review) return notFound("Review introuvable")
    if (review.snippetId !== snippetId) return notFound("Review introuvable pour cet extrait")

    // Seul l'auteur de la review peut la supprimer
    if (review.reviewerId !== session!.user.id) {
      return forbidden("Vous n'êtes pas autorisé à supprimer cette relecture")
    }

    await prisma.review.delete({ where: { id: reviewId } })

    // Recalculer reviewsCount et averageRating du snippet
    const [count, avg] = await Promise.all([
      prisma.review.count({ where: { snippetId } }),
      prisma.review.aggregate({ where: { snippetId }, _avg: { rating: true } }),
    ])

    await prisma.snippet.update({
      where: { id: snippetId },
      data: {
        reviewsCount: count,
        averageRating: (avg._avg.rating ?? 0).toFixed(2),
        // Repasse en "open" si plus aucune review
        status: count === 0 ? "open" : "reviewed",
      },
    })

    // Retirer les points de réputation accordés lors de la création (+15)
    await prisma.user.update({
      where: { id: review.reviewerId },
      data: { reputation: { decrement: 15 } },
    })

    return successResponse({ id: reviewId, deleted: true })
  } catch (e) {
    console.error("DELETE /api/snippets/[id]/reviews/[reviewId]", e)
    return internalError()
  }
}
