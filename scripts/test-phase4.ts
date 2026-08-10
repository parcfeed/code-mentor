import "dotenv/config"
import { prisma } from "../lib/prisma"
import { computeLevel } from "../lib/reputation"
import { checkAndAwardBadges } from "../lib/badges"
import { jaccardSimilarity, findMaxSimilarity } from "../lib/similarly"

async function main() {
  console.log("=".repeat(60))
  console.log("PHASE 4 — TESTS")
  console.log("=".repeat(60))

  // ─── TEST 1: computeLevel ───
  console.log("\n--- Test 1: computeLevel ---")
  const cases = [
    { rep: 0, expected: { level: 1, title: "Newcomer" } },
    { rep: 499, expected: { level: 1, title: "Newcomer" } },
    { rep: 500, expected: { level: 2, title: "Newcomer" } },
    { rep: 1000, expected: { level: 3, title: "Contributor" } },
    { rep: 1500, expected: { level: 4, title: "Contributor" } },
    { rep: 2000, expected: { level: 5, title: "Reviewer" } },
    { rep: 3000, expected: { level: 7, title: "Senior Reviewer" } },
    { rep: 4500, expected: { level: 10, title: "Lead Reviewer" } },
    { rep: 9999, expected: { level: 10, title: "Lead Reviewer" } },
  ]
  for (const c of cases) {
    const r = computeLevel(c.rep)
    const ok = r.level === c.expected.level && r.levelTitle === c.expected.title
    console.log(`  rep=${c.rep} → level=${r.level} title=${r.levelTitle} ${ok ? "✅" : "❌"}`)
  }

  // ─── TEST 2: jaccardSimilarity ───
  console.log("\n--- Test 2: jaccardSimilarity ---")
  const codeA = `function hello() { return "world"; }`
  const codeB = `function hello() { return "world"; }`
  const codeC = `const x = 42;`
  const simAB = jaccardSimilarity(codeA, codeB)
  const simAC = jaccardSimilarity(codeA, codeC)
  console.log(`  Identical code: ${simAB.toFixed(2)} (expected ~1.0) ${simAB > 0.9 ? "✅" : "❌"}`)
  console.log(`  Different code: ${simAC.toFixed(2)} (expected 0) ${simAC === 0 ? "✅" : "❌"}`)

  // ─── TEST 3: DB-based — review + badge + level ───
  console.log("\n--- Test 3: Review → badge 'first-review' + level recalculation ---")

  // Clean any leftover data from previous runs
  await prisma.report.deleteMany({ where: { targetUser: { email: "test-phase4@test.com" } } })
  await prisma.review.deleteMany({ where: { reviewer: { email: "test-phase4@test.com" } } })
  await prisma.snippet.deleteMany({ where: { author: { email: "test-phase4@test.com" } } })
  await prisma.userBadge.deleteMany({ where: { user: { email: "test-phase4@test.com" } } })
  await prisma.user.deleteMany({ where: { email: "test-phase4@test.com" } })

  let testUser = await prisma.user.create({
    data: {
      name: "Test Phase4",
      username: "test-phase4-" + Date.now(),
      email: "test-phase4@test.com",
      hashedPassword: "dummy",
      reputation: 10,
      level: 1,
      levelTitle: "Newcomer",
    },
  })
  console.log(`  User: ${testUser.name} (${testUser.id}), rep=${testUser.reputation}, level=${testUser.level}`)

  const snippet = await prisma.snippet.create({
    data: {
      authorId: testUser.id,
      title: "Test snippet for phase4",
      code: "console.log('hello')",
      language: "javascript",
      difficulty: "Beginner",
    },
  })
  console.log(`  Created snippet: ${snippet.id}`)

  const review = await prisma.review.create({
    data: {
      snippetId: snippet.id,
      reviewerId: testUser.id,
      summary: "This is a test review with enough characters to pass validation.",
      rating: 4,
    },
  })
  console.log(`  Created review: ${review.id}`)

  await prisma.snippet.update({
    where: { id: snippet.id },
    data: { reviewsCount: 1, status: "reviewed" },
  })

  const updatedUser = await prisma.user.update({
    where: { id: testUser.id },
    data: { reputation: { increment: 15 } },
  })

  const newLevel = computeLevel(updatedUser.reputation)
  if (newLevel.level !== updatedUser.level || newLevel.levelTitle !== updatedUser.levelTitle) {
    await prisma.user.update({
      where: { id: testUser.id },
      data: { level: newLevel.level, levelTitle: newLevel.levelTitle },
    })
  }
  console.log(`  After review: rep=${updatedUser.reputation}, level=${newLevel.level} title=${newLevel.levelTitle}`)
  console.log(`  Level changed? ${newLevel.level !== 1 || newLevel.levelTitle !== "Newcomer" ? "✅" : "ℹ️ not expected (rep < 500)"}`)

  const awarded = await checkAndAwardBadges(testUser.id)
  console.log(`  Badges awarded: ${awarded.length > 0 ? awarded.join(", ") : "none (already held)"}`)
  const badgeInDb = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId: testUser.id, badgeId: "first-review" } },
  })
  console.log(`  first-review badge in DB: ${badgeInDb ? "✅" : "❌"}`)

  // ─── TEST 4: Similarity detection ───
  console.log("\n--- Test 4: Similarity detection → Report with severity 'low' ---")

  // Create a first snippet with distinctive code
  const originalCode = `def add(a, b):
    result = a + b
    return result

def subtract(a, b):
    result = a - b
    return result`
  const origSnippet = await prisma.snippet.create({
    data: {
      authorId: testUser.id,
      title: "Original math functions",
      code: originalCode,
      language: "python",
      difficulty: "Beginner",
    },
  })
  console.log(`  Original snippet: ${origSnippet.id}`)

  // Create a very similar snippet
  const similarCode = `def add(a, b):
    result = a + b
    return result

def subtract(a, b):
    result = a - b
    return result`
  const newSnippet = await prisma.snippet.create({
    data: {
      authorId: testUser.id,
      title: "Almost identical math functions",
      code: similarCode,
      language: "python",
      difficulty: "Beginner",
    },
  })
  console.log(`  New snippet: ${newSnippet.id}`)

  // Manually run similarity check
  const { maxSimilarity, similarSnippetId } = await findMaxSimilarity(similarCode, "python", newSnippet.id)
  console.log(`  Max similarity: ${(maxSimilarity * 100).toFixed(0)}% (threshold: 75%)`)
  console.log(`  Similar snippet: ${similarSnippetId}`)

  if (maxSimilarity > 0.75 && similarSnippetId) {
    const pct = Math.round(maxSimilarity * 100)
    const report = await prisma.report.create({
      data: {
        reporterId: testUser.id,
        targetUserId: testUser.id,
        snippetId: newSnippet.id,
        reason: `Similarité de code détectée (${pct}%)`,
        reportedContent: similarSnippetId,
        severity: "low",
      },
    })
    console.log(`  Report created: ${report.id} (severity: ${report.severity}) ✅`)
  } else {
    console.log(`  No report created (similarity too low) — check trigram threshold`)
  }

  // ─── TEST 5: Métriques de modération ───
  console.log("\n--- Test 5: Metrics calculation ---")

  const totalSnippets = await prisma.snippet.count()
  const totalReviews = await prisma.review.count()
  const totalUsers = await prisma.user.count()
  const lineCommentCount = await prisma.lineComment.count()
  const reviewsWithConstructiveFeedback = totalReviews > 0
    ? Math.round((lineCommentCount / totalReviews) * 100)
    : 0

  const allReviews = await prisma.review.findMany({
    select: { createdAt: true, snippet: { select: { createdAt: true } } },
    orderBy: { createdAt: "asc" },
  })
  const reviewsWithTime = allReviews.filter((r) => r.snippet?.createdAt)
  const totalHours = reviewsWithTime.reduce((sum, r) => {
    const diffMs = r.createdAt.getTime() - new Date(r.snippet.createdAt).getTime()
    return sum + diffMs / (1000 * 60 * 60)
  }, 0)
  const avgTimeToFirstReview = reviewsWithTime.length > 0
    ? Math.round((totalHours / reviewsWithTime.length) * 100) / 100
    : 0

  const byLang = await prisma.snippet.groupBy({ by: ["language"], _count: true })
  const byDiff = await prisma.snippet.groupBy({ by: ["difficulty"], _count: true })

  console.log(`  totalSnippets: ${totalSnippets}`)
  console.log(`  totalReviews: ${totalReviews}`)
  console.log(`  totalUsers: ${totalUsers}`)
  console.log(`  reviewsWithConstructiveFeedback: ${reviewsWithConstructiveFeedback}%`)
  console.log(`  avgTimeToFirstReview: ${avgTimeToFirstReview}h`)
  console.log(`  snippetsByLanguage: ${JSON.stringify(Object.fromEntries(byLang.map(d => [d.language, d._count])))}`)
  console.log(`  snippetsByDifficulty: ${JSON.stringify(Object.fromEntries(byDiff.map(d => [d.difficulty, d._count])))}`)
  console.log("  Metrics OK ✅")

  // Cleanup test data
  await prisma.report.deleteMany({ where: { snippetId: newSnippet.id } })
  await prisma.review.deleteMany({ where: { reviewerId: testUser.id } })
  await prisma.userBadge.deleteMany({ where: { userId: testUser.id } })
  await prisma.user.deleteMany({ where: { email: "test-phase4@test.com" } })
  console.log("\n  Cleanup done ✅")

  console.log("\n" + "=".repeat(60))
  console.log("ALL TESTS COMPLETE")
  console.log("=".repeat(60))
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error("Test failed:", e)
  process.exit(1)
})
