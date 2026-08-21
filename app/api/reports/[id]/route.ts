import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModerator } from "@/lib/auth-guards"
import { successResponse, validationError, notFound, conflict, internalError } from "@/lib/api-response"
import { computeLevel } from "@/lib/reputation"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireModerator()
    if (error) return error

    const { id } = await params
    const body = await req.json()
    const { status, deleteContent, applySanction } = body

    if (!status || !["resolved", "dismissed"].includes(status)) {
      return validationError("Le statut doit être 'resolved' ou 'dismissed'")
    }

    const report = await prisma.report.findUnique({ where: { id } })
    if (!report) return notFound("Signalement introuvable")

    // Garantir l'idempotence
    if (report.status !== "pending") {
      return conflict("Ce signalement a déjà été traité")
    }

    if (status === "resolved") {
      // 1. Suppression du contenu s'il est explicitement demandé
      if (deleteContent === true) {
        if (report.reviewId) {
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
        } else if (report.snippetId) {
          const snippet = await prisma.snippet.findUnique({
            where: { id: report.snippetId },
            select: { id: true },
          })
          if (snippet) {
            await prisma.snippet.delete({ where: { id: snippet.id } })
          }
        }
      }

      // 2. Application de la sanction de réputation si elle est explicitement demandée
      if (applySanction === true && report.targetUserId) {
        const targetUser = await prisma.user.findUnique({
          where: { id: report.targetUserId },
          select: { id: true, reputation: true, level: true, levelTitle: true },
        })
        if (targetUser) {
          const updatedUser = await prisma.user.update({
            where: { id: targetUser.id },
            data: { reputation: { decrement: 15 } },
          })
          const newLevel = computeLevel(updatedUser.reputation)
          if (newLevel.level !== updatedUser.level || newLevel.levelTitle !== updatedUser.levelTitle) {
            await prisma.user.update({
              where: { id: targetUser.id },
              data: { level: newLevel.level, levelTitle: newLevel.levelTitle },
            })
          }
        }
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