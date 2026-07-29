import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, validationError, notFound, conflict, forbidden, internalError } from "@/lib/api-response"
import { computeLevel } from "@/lib/reputation"
import { checkAndAwardBadges } from "@/lib/badges"

const createReviewSchema = z.object({
  summary: z.string().min(20),
  rating: z.number().int().min(1).max(5),
  drafts: z.array(z.object({
    line: z.number().int().positive(),
    content: z.string().min(1),
  })).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params

    const snippet = await prisma.snippet.findUnique({ where: { id } })
    if (!snippet) return notFound("Snippet introuvable")

    // L'auteur ne peut pas reviewer son propre snippet
    if (snippet.authorId === session!.user.id) {
      return forbidden("Vous ne pouvez pas reviewer votre propre snippet")
    }

    // Un user ne peut soumettre qu'une seule review par snippet
    const existing = await prisma.review.findUnique({
      where: { snippetId_reviewerId: { snippetId: id, reviewerId: session!.user.id } },
    })
    if (existing) {
      return conflict("Vous avez déjà soumis une review pour ce snippet")
    }

    const body = createReviewSchema.safeParse(await req.json())
    if (!body.success) {
      return validationError("Invalid input", body.error.issues.map((i) => ({
        field: i.path.join("."),
        reason: i.code,
        message: i.message,
      })))
    }

    const { summary, rating, drafts } = body.data

    const review = await prisma.review.create({
      data: {
        snippetId: id,
        reviewerId: session!.user.id,
        summary: summary.trim(),
        rating,
        lineComments: {
          create: (drafts ?? []).map((d) => ({
            lineNumber: d.line,
            content: d.content,
          })),
        },
      },
      include: {
        reviewer: { select: { id: true, name: true, username: true, image: true, reputation: true } },
        lineComments: { orderBy: { lineNumber: "asc" } },
        votes: true,
      },
    })

    const count = await prisma.review.count({ where: { snippetId: id } })
    const avg = await prisma.review.aggregate({ where: { snippetId: id }, _avg: { rating: true } })

    await prisma.snippet.update({
      where: { id },
      data: {
        reviewsCount: count,
        averageRating: (avg._avg.rating ?? 0).toFixed(2),
        status: "reviewed",
      },
    })

    const updatedUser = await prisma.user.update({
      where: { id: session!.user.id },
      data: { reputation: { increment: 15 } },
    })

    const newLevel = computeLevel(updatedUser.reputation)
    if (newLevel.level !== updatedUser.level || newLevel.levelTitle !== updatedUser.levelTitle) {
      await prisma.user.update({
        where: { id: session!.user.id },
        data: { level: newLevel.level, levelTitle: newLevel.levelTitle },
      })
    }

    await checkAndAwardBadges(session!.user.id)

    return successResponse(review, 201)
  } catch (e) {
    console.error("POST /api/snippets/[id]/reviews", e)
    return internalError()
  }
}