import type { DefaultSession, DefaultUser } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      reputation: number
      level: number
      levelTitle: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    username: string
    role: string
    reputation: number
    level: number
    levelTitle: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    username: string
    role: string
    reputation: number
    level: number
    levelTitle: string
  }
}