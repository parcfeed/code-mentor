import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, validationError, conflict, notFound, internalError } from "@/lib/api-response"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id: _snippetId, reviewId } = await params
    const body = await req.json()
    const { kind } = body

    if (!kind || !["up", "down"].includes(kind)) {
      return validationError("Le type de vote doit être 'up' ou 'down'")
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    if (!review) return notFound("Relecture introuvable")

    if (review.reviewerId === session!.user.id) {
      return conflict("Vous ne pouvez pas voter sur votre propre relecture")
    }

    const existing = await prisma.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId, userId: session!.user.id } },
    })

    let vote
    if (existing) {
      if (existing.kind === kind) {
        await prisma.reviewVote.delete({
          where: { reviewId_userId: { reviewId, userId: session!.user.id } },
        })
        vote = null
      } else {
        vote = await prisma.reviewVote.update({
          where: { reviewId_userId: { reviewId, userId: session!.user.id } },
          data: { kind },
        })
      }
    } else {
      vote = await prisma.reviewVote.create({
        data: { reviewId, userId: session!.user.id, kind },
      })
    }

    return successResponse(vote)
  } catch (e) {
    console.error("POST /api/snippets/[id]/reviews/[reviewId]/vote", e)
    return internalError()
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; reviewId: string }> }) {
  try {
    const { reviewId } = await params
    const votes = await prisma.reviewVote.findMany({ where: { reviewId } })
    const upvotes = votes.filter((v) => v.kind === "up").length
    const downvotes = votes.filter((v) => v.kind === "down").length
    return successResponse({ upvotes, downvotes, votes })
  } catch (e) {
    console.error("GET /api/snippets/[id]/reviews/[reviewId]/vote", e)
    return internalError()
  }
}