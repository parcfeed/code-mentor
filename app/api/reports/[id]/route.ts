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