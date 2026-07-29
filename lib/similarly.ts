import { prisma } from "@/lib/prisma"

function normalize(code: string): string {
  return code
    .toLowerCase()
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/#.*$/gm, "")
    .replace(/'''[\s\S]*?'''/g, "")
    .replace(/"""[\s\S]*?"""/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function trigrams(text: string): Set<string> {
  const words = text.split(/\s+/)
  const set = new Set<string>()
  for (let i = 0; i <= words.length - 3; i++) {
    set.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }
  return set
}

export function jaccardSimilarity(a: string, b: string): number {
  const setA = trigrams(normalize(a))
  const setB = trigrams(normalize(b))

  if (setA.size === 0 && setB.size === 0) return 0

  let intersection = 0
  for (const t of setA) {
    if (setB.has(t)) intersection++
  }

  const union = setA.size + setB.size - intersection
  if (union === 0) return 0

  return intersection / union
}

export async function findMaxSimilarity(
  code: string,
  language: string,
  excludeSnippetId?: string
): Promise<{ maxSimilarity: number; similarSnippetId: string | null }> {
  const existing = await prisma.snippet.findMany({
    where: {
      language,
      ...(excludeSnippetId ? { id: { not: excludeSnippetId } } : {}),
    },
    select: { id: true, code: true },
    take: 500,
    orderBy: { createdAt: "desc" },
  })

  let maxSim = 0
  let similarId: string | null = null

  for (const s of existing) {
    const sim = jaccardSimilarity(code, s.code)
    if (sim > maxSim) {
      maxSim = sim
      similarId = s.id
    }
  }

  return { maxSimilarity: maxSim, similarSnippetId: similarId }
}
