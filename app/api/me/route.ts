import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth-guards"
import { successResponse, validationError, internalError, conflict } from "@/lib/api-response"

export async function GET() {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const user = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        reputation: true,
        level: true,
        levelTitle: true,
        bio: true,
        joinedAt: true,
        _count: { select: { snippets: true, reviews: true } },
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: "desc" },
        },
      },
    })

    return successResponse(user)
  } catch (e) {
    console.error("GET /api/me", e)
    return internalError()
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { session, error } = await requireUser()
    if (error) return error

    const body = await req.json()
    const { name, username, bio, email, defaultAnonymous, showInLeaderboard, image } = body

    // Validation : name ne doit pas être vide
    if (name !== undefined && !name?.trim()) {
      return validationError("Le nom ne peut pas être vide", [
        { field: "name", reason: "too_small", message: "Le nom ne peut pas être vide" },
      ])
    }

    // Validation : bio max 500 chars
    if (bio !== undefined && bio.length > 500) {
      return validationError("La bio ne peut pas dépasser 500 caractères", [
        { field: "bio", reason: "too_big", message: "La bio ne peut pas dépasser 500 caractères" },
      ])
    }

    // Validation : image de profil (taille maximale 2 Mo et format correct)
    if (image !== undefined && image !== null) {
      if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
        return validationError("Le format de l'image de profil est invalide. Formats acceptés : JPG, PNG, WebP.", [
          { field: "image", reason: "invalid_type", message: "Formats acceptés : JPG, PNG, WebP." }
        ])
      }
      const approxBytes = (image.length * 3) / 4
      if (approxBytes > 2.1 * 1024 * 1024) {
        return validationError("L'image de profil dépasse la limite autorisée de 2 Mo.", [
          { field: "image", reason: "too_big", message: "L'image de profil dépasse la limite autorisée de 2 Mo." }
        ])
      }
    }

    const currentUserId = session!.user.id

    // Vérification de conflit username
    if (username?.trim()) {
      const existing = await prisma.user.findUnique({
        where: { username: username.trim() },
        select: { id: true },
      })
      if (existing && existing.id !== currentUserId) {
        return conflict("Ce nom d'utilisateur est déjà pris")
      }
    }

    // Vérification de conflit email
    if (email?.trim()) {
      const existing = await prisma.user.findUnique({
        where: { email: email.trim() },
        select: { id: true },
      })
      if (existing && existing.id !== currentUserId) {
        return conflict("Cette adresse e-mail est déjà utilisée")
      }
    }

    const data: Record<string, string | boolean | null> = {}
    if (name?.trim()) data.name = name.trim()
    if (username?.trim()) data.username = username.trim()
    if (bio !== undefined) data.bio = bio
    if (email?.trim()) data.email = email.trim()
    if (defaultAnonymous !== undefined) data.defaultAnonymous = Boolean(defaultAnonymous)
    if (showInLeaderboard !== undefined) data.showInLeaderboard = Boolean(showInLeaderboard)
    if (image !== undefined) data.image = image

    const updated = await prisma.user.update({
      where: { id: currentUserId },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
        bio: true,
      },
    })

    return successResponse(updated)
  } catch (e) {
    console.error("PATCH /api/me", e)
    return internalError()
  }
}