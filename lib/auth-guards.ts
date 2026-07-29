import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { unauthorized, forbidden } from "@/lib/api-response"

export async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { session: null, error: unauthorized() }
  }
  return { session, error: null }
}

export async function requireModerator() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { session: null, error: unauthorized() }
  }
  if (session.user.role !== "moderator" && session.user.role !== "admin") {
    return { session: null, error: forbidden("Moderator or admin access required") }
  }
  return { session, error: null }
}