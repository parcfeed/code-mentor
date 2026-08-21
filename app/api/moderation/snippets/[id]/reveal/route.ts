import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModerator } from "@/lib/auth-guards"
import { successResponse, notFound, internalError } from "@/lib/api-response"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireModerator()
    if (error) return error

    const { id } = await params

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      select: {
        id: true,
        isAnonymous: true,
        author: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    })

    if (!snippet) return notFound("Snippet introuvable")

    return successResponse({
      snippetId: snippet.id,
      isAnonymous: snippet.isAnonymous,
      author: {
        id: snippet.author.id,
        name: snippet.author.name,
        username: snippet.author.username,
        image: snippet.author.image,
      },
    })
  } catch (e) {
    console.error("GET /api/moderation/snippets/[id]/reveal", e)
    return internalError()
  }
}
