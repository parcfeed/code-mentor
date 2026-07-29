import { prisma } from "@/lib/prisma"

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const awarded: string[] = []

  const existingBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  })
  const has = new Set(existingBadges.map((b) => b.badgeId))

  async function award(badgeId: string) {
    if (has.has(badgeId)) return
    // S'assurer que le badge existe avant de l'attribuer
    const badge = await prisma.badge.findUnique({ where: { id: badgeId } })
    if (!badge) return
    await prisma.userBadge.create({
      data: { userId, badgeId },
    })
    awarded.push(badgeId)
    has.add(badgeId)
  }

  const reviewsGiven = await prisma.review.findMany({
    where: { reviewerId: userId },
    include: {
      snippet: { select: { language: true, createdAt: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const reviewsCount = reviewsGiven.length

  // first-review
  if (reviewsCount >= 1) {
    await award("first-review")
  }

  // mentor
  if (reviewsCount >= 50) {
    await award("mentor")
  }

  // fast-feedback
  if (reviewsCount >= 5) {
    const fastCount = reviewsGiven.filter((r) => {
      const diffMs = r.createdAt.getTime() - r.snippet.createdAt.getTime()
      return diffMs <= 2 * 60 * 60 * 1000
    }).length
    if (fastCount >= 5) {
      await award("fast-feedback")
    }
  }

  // Badges par langage — 10+ langages couverts selon le CDC
  const BADGE_BY_LANG: Record<string, { badgeId: string; threshold: number }> = {
    python:      { badgeId: "python-expert",     threshold: 25 },
    javascript:  { badgeId: "js-guru",           threshold: 25 },
    typescript:  { badgeId: "ts-expert",         threshold: 25 },
    java:        { badgeId: "java-expert",       threshold: 25 },
    "c++":       { badgeId: "cpp-expert",        threshold: 25 },
    cpp:         { badgeId: "cpp-expert",        threshold: 25 },
    c:           { badgeId: "c-expert",          threshold: 25 },
    rust:        { badgeId: "rust-expert",       threshold: 25 },
    go:          { badgeId: "go-expert",         threshold: 25 },
    kotlin:      { badgeId: "kotlin-expert",     threshold: 25 },
    swift:       { badgeId: "swift-expert",      threshold: 25 },
    php:         { badgeId: "php-expert",        threshold: 25 },
    ruby:        { badgeId: "ruby-expert",       threshold: 25 },
    "c#":        { badgeId: "csharp-expert",     threshold: 25 },
    csharp:      { badgeId: "csharp-expert",     threshold: 25 },
    sql:         { badgeId: "sql-expert",        threshold: 25 },
  }

  const langRatings: Record<string, { count: number }> = {}
  for (const r of reviewsGiven) {
    if (r.rating >= 4) {
      const lang = r.snippet.language.toLowerCase()
      if (!langRatings[lang]) langRatings[lang] = { count: 0 }
      langRatings[lang].count++
    }
  }

  for (const [lang, config] of Object.entries(BADGE_BY_LANG)) {
    if ((langRatings[lang]?.count ?? 0) >= config.threshold) {
      await award(config.badgeId)
    }
  }

  // clean-code
  if (reviewsCount >= 10) {
    const avgRating = reviewsGiven.reduce((s, r) => s + r.rating, 0) / reviewsCount
    if (avgRating >= 4.5) {
      await award("clean-code")
    }
  }

  // kind-reviewer
  const reviewsByOthers = await prisma.review.findMany({
    where: { snippet: { authorId: userId } },
    select: { id: true },
  })
  if (reviewsByOthers.length >= 10) {
    const reviewIds = reviewsByOthers.map((r) => r.id)
    const votes = await prisma.reviewVote.findMany({
      where: { reviewId: { in: reviewIds } },
    })
    const votesPerReview: Record<string, { up: number; down: number }> = {}
    for (const v of votes) {
      if (!votesPerReview[v.reviewId]) votesPerReview[v.reviewId] = { up: 0, down: 0 }
      votesPerReview[v.reviewId][v.kind === "up" ? "up" : "down"]++
    }
    const kindCount = Object.values(votesPerReview).filter(
      (vr) => vr.up > vr.down
    ).length
    if (kindCount / reviewsByOthers.length >= 0.9) {
      await award("kind-reviewer")
    }
  }

  return awarded
}
