import { NextRequest } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, validationError, internalError } from "@/lib/api-response"
import { findMaxSimilarity } from "@/lib/similarly"

const createSnippetSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  code: z.string().min(1),
  language: z.string().optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  isAnonymous: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") ?? ""
    const language = searchParams.get("language")
    const difficulty = searchParams.get("difficulty")
    const status = searchParams.get("status")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "6")))

    const where: Record<string, unknown> = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { language: { contains: q, mode: "insensitive" } },
      ]
    }
    if (language && language !== "all") where.language = language
    if (difficulty && difficulty !== "all") where.difficulty = difficulty
    if (status && status !== "all") where.status = status

    const [snippets, total] = await Promise.all([
      prisma.snippet.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.snippet.count({ where }),
    ])

    return successResponse({
      snippets,
      total,
      page,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (e) {
    console.error("GET /api/snippets", e)
    return internalError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const body = createSnippetSchema.safeParse(await req.json())
    if (!body.success) {
      return validationError("Invalid input", body.error.issues.map((i) => ({
        field: i.path.join("."),
        reason: i.code,
        message: i.message,
      })))
    }

    const { title, description, code, language, difficulty, isAnonymous } = body.data

    const snippet = await prisma.snippet.create({
      data: {
        authorId: session!.user.id,
        title,
        description: description ?? "",
        code,
        language: language ?? "",
        difficulty,
        isAnonymous: isAnonymous ?? false,
      },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
      },
    })

    if (language) {
      const { maxSimilarity, similarSnippetId } = await findMaxSimilarity(code, language, snippet.id)
      if (maxSimilarity > 0.75 && similarSnippetId) {
        const pct = Math.round(maxSimilarity * 100)
        await prisma.report.create({
          data: {
            reporterId: session!.user.id,
            targetUserId: session!.user.id,
            snippetId: snippet.id,
            reason: `Similarité de code détectée (${pct}%)`,
            reportedContent: similarSnippetId,
            severity: "low",
          },
        })
      }
    }

    return successResponse(snippet, 201)
  } catch (e) {
    console.error("POST /api/snippets", e)
    return internalError()
  }
}