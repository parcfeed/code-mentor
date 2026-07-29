import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, notFound, forbidden, internalError, validationError } from "@/lib/api-response"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true, username: true, image: true, reputation: true } },
            lineComments: { orderBy: { lineNumber: "asc" } },
            votes: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })
    if (!snippet) return notFound("Snippet introuvable")

    // Masquer l'auteur si le snippet est anonyme
    const result = {
      ...snippet,
      author: snippet.isAnonymous
        ? { id: "", name: "Anonyme", username: "", image: null }
        : snippet.author,
    }

    return successResponse(result)
  } catch (e) {
    console.error("GET /api/snippets/[id]", e)
    return internalError()
  }
}

const updateSnippetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  code: z.string().min(1).optional(),
  language: z.string().optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
  isAnonymous: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params

    const snippet = await prisma.snippet.findUnique({ where: { id } })
    if (!snippet) return notFound("Snippet introuvable")

    // Seul l'auteur ou un admin peut modifier
    const isAdmin = session!.user.role === "admin"
    if (snippet.authorId !== session!.user.id && !isAdmin) {
      return forbidden("Vous n'êtes pas autorisé à modifier cet extrait")
    }

    const body = updateSnippetSchema.safeParse(await req.json())
    if (!body.success) {
      return validationError("Invalid input", body.error.issues.map((i) => ({
        field: i.path.join("."),
        reason: i.code,
        message: i.message,
      })))
    }

    const updated = await prisma.snippet.update({
      where: { id },
      data: body.data,
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    })

    return successResponse(updated)
  } catch (e) {
    console.error("PATCH /api/snippets/[id]", e)
    return internalError()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const { id } = await params

    const snippet = await prisma.snippet.findUnique({ where: { id } })
    if (!snippet) return notFound("Snippet introuvable")

    // Seul l'auteur ou un admin peut supprimer
    const isAdmin = session!.user.role === "admin"
    if (snippet.authorId !== session!.user.id && !isAdmin) {
      return forbidden("Vous n'êtes pas autorisé à supprimer cet extrait")
    }

    await prisma.snippet.delete({ where: { id } })

    return successResponse({ id, deleted: true })
  } catch (e) {
    console.error("DELETE /api/snippets/[id]", e)
    return internalError()
  }
}