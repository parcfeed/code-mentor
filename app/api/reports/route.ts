import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser, requireModerator } from "@/lib/auth-guards"
import { successResponse, validationError, notFound, internalError } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const body = await req.json()
    const { targetUserId, reviewId, reason, reportedContent, severity } = body

    if (!targetUserId || !reason?.trim()) {
      return validationError("targetUserId et reason sont obligatoires")
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!target) return notFound("Utilisateur cible introuvable")

    const report = await prisma.report.create({
      data: {
        reporterId: session!.user.id,
        targetUserId,
        reviewId: reviewId ?? null,
        reason: reason.trim(),
        reportedContent: (reportedContent ?? "").trim(),
        severity: severity ?? "low",
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
        review: { select: { id: true, snippet: { select: { title: true } } } },
      },
    })

    const mapped = reports.map((r) => ({
      id: r.id,
      reviewSnippet: r.review?.snippet?.title ?? "Inconnu",
      reason: r.reason,
      reportedContent: r.reportedContent,
      reporter: r.reporter,
      target: r.targetUser,
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

