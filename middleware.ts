import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  // Non authentifié → rediriger vers /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // /moderation/* : réservé aux modérateurs et admins
  if (
    pathname.startsWith("/moderation") &&
    token.role !== "moderator" &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/snippets/:path*",
    "/leaderboard/:path*",
    "/moderation/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
}
