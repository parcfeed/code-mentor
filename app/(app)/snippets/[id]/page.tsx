import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { SnippetDetail } from "@/components/snippet-detail"

export default async function SnippetPage({ params }: { params: Promise<{ id: string }> }) {
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
  if (!snippet) notFound()

  const session = await getServerSession(authOptions)
  const isModerator = session?.user?.role === "moderator"

  const mappedSnippet = {
    id: snippet.id,
    title: snippet.title,
    code: snippet.code,
    language: snippet.language,
    difficulty: snippet.difficulty,
    isAnonymous: snippet.isAnonymous,
    // Un modérateur peut voir l'auteur réel d'un snippet anonyme
    author:
      snippet.isAnonymous && !isModerator
        ? { id: "", name: "Anonyme", username: "", image: null }
        : snippet.author,
    createdAt: snippet.createdAt.toISOString(),
    reviewsCount: snippet.reviewsCount,
    averageRating: Number(snippet.averageRating),
    status: snippet.status,
    description: snippet.description,
  }

  const mappedReviews = snippet.reviews.map((r) => ({
    id: r.id,
    snippetId: r.snippetId,
    snippetTitle: snippet.title,
    reviewer: r.reviewer,
    summary: r.summary,
    rating: r.rating,
    upvotes: r.votes.filter((v) => v.kind === "up").length,
    downvotes: r.votes.filter((v) => v.kind === "down").length,
    createdAt: r.createdAt.toISOString(),
    lineComments: r.lineComments.map((lc) => ({
      id: lc.id,
      line: lc.lineNumber,
      author: { id: r.reviewer.id, name: r.reviewer.name, avatar: r.reviewer.image ?? "" },
      content: lc.content,
      createdAt: lc.createdAt.toISOString(),
    })),
  }))

  return <SnippetDetail snippet={mappedSnippet} reviews={mappedReviews} />
}