import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser, requireModerator } from "@/lib/auth-guards"
import { successResponse, validationError, notFound, internalError } from "@/lib/api-response"

const createReportSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.string().min(1, "La raison est obligatoire"),
  reporterComment: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const body = createReportSchema.safeParse(await req.json())
    if (!body.success) {
      return validationError("Champs invalides", body.error.issues.map((i) => ({
        field: i.path.join("."),
        reason: i.code,
        message: i.message,
      })))
    }

    const { reviewId, reason, reporterComment } = body.data

    // Récupérer la review pour déterminer targetUserId, snippetId et reportedContent
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: { select: { id: true } },
        snippet: { select: { id: true } },
      },
    })
    if (!review) return notFound("Review introuvable")

    const targetUserId = review.reviewer.id
    const snippetId = review.snippet.id
    const reportedContent = review.summary.slice(0, 500)

    const report = await prisma.report.create({
      data: {
        reporterId: session!.user.id,
        targetUserId,
        reviewId,
        snippetId,
        reason: reason.trim(),
        reporterComment: reporterComment?.trim() || null,
        reportedContent,
        severity: "low",
      },
      include: {
        reporter: { select: { id: true, name: true, image: true } },
        targetUser: { select: { id: true, name: true, image: true } },
      },
    })

    return successResponse(report, 201)
  } catch (e) {
    console.error("POST /api/reports", e)
    return internalError()
  }
}

export async function GET() {
  try {
    const { session, error } = await requireModerator()
    if (error) return error

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, image: true } },
        targetUser: { select: { id: true, name: true, image: true } },
        review: { select: { id: true, snippet: { select: { id: true, title: true } } } },
      },
    })

    const mapped = reports.map((r) => ({
      id: r.id,
      reviewSnippet: r.review?.snippet?.title ?? null,
      snippetId: r.review?.snippet?.id ?? r.snippetId ?? null,
      reason: r.reason,
      reporterComment: r.reporterComment ?? null,
      reportedContent: r.reportedContent,
      reporter: { id: r.reporter.id, name: r.reporter.name, avatar: r.reporter.image ?? "" },
      target: { id: r.targetUser.id, name: r.targetUser.name, avatar: r.targetUser.image ?? "" },
      createdAt: r.createdAt.toISOString(),
      status: r.status,
      severity: r.severity,
    }))

    return successResponse(mapped)
  } catch (e) {
    console.error("GET /api/reports", e)
    return internalError()
  }
}
