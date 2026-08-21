import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  // Ignorer les routes API (gérées par les handlers eux-mêmes)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Non authentifié → rediriger vers /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // /moderation/* : réservé aux modérateurs
  if (pathname.startsWith("/moderation") && token.role !== "moderator") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/snippets/:path*",
    "/leaderboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    // Exclure les routes API (gérées par requireModerator() dans route.ts)
    "/moderation/:path*",
  ],
}
