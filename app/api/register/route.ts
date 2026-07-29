import bcrypt from "bcryptjs"

import { prisma } from "@/lib/prisma"
import { conflict, internalError, successResponse, validationError } from "@/lib/api-response"
import { rateLimit } from "@/lib/rate-limit"
import { slugifyName } from "@/lib/generate-username"

/**
 * Génère un username unique à partir du nom complet.
 * "Amina Cherif" → "amina.cherif", puis "amina.cherif2" si déjà pris, etc.
 */
async function generateUsername(name: string): Promise<string> {
  const base = slugifyName(name)

  // Vérifier si la base est libre
  const existing = await prisma.user.findUnique({ where: { username: base } })
  if (!existing) return base

  // Sinon ajouter un suffixe numérique
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}${i}`
    const taken = await prisma.user.findUnique({ where: { username: candidate } })
    if (!taken) return candidate
  }

  // Fallback avec timestamp
  return `${base}${Date.now()}`
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown"
    const rl = rateLimit(`register:${ip}`, 5, 60_000)
    if (!rl.allowed) {
      return validationError("Trop de tentatives d'inscription. Veuillez réessayer plus tard.")
    }

    const { name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return validationError("Champs obligatoires manquants : nom, e-mail, mot de passe")
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } })
    if (existingEmail) {
      return conflict("Cet e-mail est déjà inscrit")
    }

    const username = await generateUsername(name.trim())
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username,
        email: email.trim(),
        hashedPassword,
        reputation: 0,
        level: 1,
        levelTitle: "Newcomer",
        role: "member",
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
        reputation: true,
        level: true,
        levelTitle: true,
        role: true,
        joinedAt: true,
        createdAt: true,
      },
    })

    return successResponse(user, 201)
  } catch {
    return internalError()
  }
}
