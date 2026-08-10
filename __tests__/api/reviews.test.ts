import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — doivent être déclarés AVANT tout import qui les utilise
// ---------------------------------------------------------------------------

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    snippet: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    review: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    user: { update: vi.fn(), findUnique: vi.fn() },
    userBadge: { findMany: vi.fn() },
    badge: { findUnique: vi.fn() },
    report: { findMany: vi.fn(), create: vi.fn() },
  },
}))

// Mock checkAndAwardBadges pour éviter les side-effects
vi.mock('@/lib/badges', () => ({
  checkAndAwardBadges: vi.fn().mockResolvedValue([]),
}))

// ---------------------------------------------------------------------------
// Imports après les mocks
// ---------------------------------------------------------------------------
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Helper : construit une NextRequest compatible
// ---------------------------------------------------------------------------
function makeRequest(url: string, options?: RequestInit) {
  return new Request(url, options) as any
}

// ---------------------------------------------------------------------------
// Test 1 — Auto-review bloquée (403)
// ---------------------------------------------------------------------------
describe('POST /api/snippets/[id]/reviews — auto-review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne 403 quand l\'auteur tente de reviewer son propre snippet', async () => {
    // Session : user "user-1"
    ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-1', role: 'member' },
    })

    // Le snippet appartient au même user
    ;(prisma.snippet.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'snippet-1',
      authorId: 'user-1',
      isAnonymous: false,
    })

    const { POST } = await import('@/app/api/snippets/[id]/reviews/route')

    const req = makeRequest(
      'http://localhost/api/snippets/snippet-1/reviews',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'Great code, very clean and well structured!',
          rating: 5,
        }),
      }
    )

    const res = await POST(req, { params: Promise.resolve({ id: 'snippet-1' }) })
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Test 2 — Double review bloquée (409)
// ---------------------------------------------------------------------------
describe('POST /api/snippets/[id]/reviews — double review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne 409 quand une review existe déjà pour ce snippet', async () => {
    // Session : user "user-2" (différent de l'auteur)
    ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-2', role: 'member' },
    })

    // Le snippet appartient à un autre user
    ;(prisma.snippet.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'snippet-1',
      authorId: 'user-1',
      isAnonymous: false,
    })

    // Une review existe déjà
    ;(prisma.review.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'review-existing',
      snippetId: 'snippet-1',
      reviewerId: 'user-2',
    })

    const { POST } = await import('@/app/api/snippets/[id]/reviews/route')

    const req = makeRequest(
      'http://localhost/api/snippets/snippet-1/reviews',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'Great code, very clean and well structured!',
          rating: 5,
        }),
      }
    )

    const res = await POST(req, { params: Promise.resolve({ id: 'snippet-1' }) })
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Test 3 — Anonymat côté API
// ---------------------------------------------------------------------------
describe('GET /api/snippets/[id] — anonymat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('masque le nom de l\'auteur quand isAnonymous === true', async () => {
    ;(prisma.snippet.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'snippet-anon',
      title: 'Mon snippet',
      code: 'console.log("hello")',
      language: 'javascript',
      isAnonymous: true,
      authorId: 'user-real',
      author: {
        id: 'user-real',
        name: 'Alice Martin',
        username: 'alice.martin',
        image: null,
      },
      reviews: [],
    })

    const { GET } = await import('@/app/api/snippets/[id]/route')

    const req = makeRequest('http://localhost/api/snippets/snippet-anon')

    const res = await GET(req, { params: Promise.resolve({ id: 'snippet-anon' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)

    // Le nom réel ne doit PAS apparaître
    expect(json.data.author.name).not.toBe('Alice Martin')
    // Le nom affiché doit être "Anonyme"
    expect(json.data.author.name).toBe('Anonyme')
  })

  it('retourne le vrai auteur quand isAnonymous === false', async () => {
    ;(prisma.snippet.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'snippet-visible',
      title: 'Mon snippet',
      code: 'console.log("hello")',
      language: 'javascript',
      isAnonymous: false,
      authorId: 'user-bob',
      author: {
        id: 'user-bob',
        name: 'Bob Dupont',
        username: 'bob.dupont',
        image: null,
      },
      reviews: [],
    })

    const { GET } = await import('@/app/api/snippets/[id]/route')

    const req = makeRequest('http://localhost/api/snippets/snippet-visible')

    const res = await GET(req, { params: Promise.resolve({ id: 'snippet-visible' }) })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.author.name).toBe('Bob Dupont')
  })
})

// ---------------------------------------------------------------------------
// Test 4 — Modération réservée aux modérateurs
// ---------------------------------------------------------------------------
describe('GET /api/reports — contrôle d\'accès', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retourne 403 quand le rôle est "member"', async () => {
    ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-member', role: 'member' },
    })

    const { GET } = await import('@/app/api/reports/route')

    const req = makeRequest('http://localhost/api/reports')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(403)
    expect(json.success).toBe(false)
  })

  it('retourne 200 quand le rôle est "moderator"', async () => {
    ;(getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { id: 'user-mod', role: 'moderator' },
    })

    ;(prisma.report.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

    const { GET } = await import('@/app/api/reports/route')

    const req = makeRequest('http://localhost/api/reports')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })
})
