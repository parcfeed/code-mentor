import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { prisma } from "@/lib/prisma"
import { checkBruteForce, rateLimit, recordFailedAttempt, resetBruteForce } from "@/lib/rate-limit"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const ipKey = `rate:${credentials.email}`
        const rl = rateLimit(ipKey, 10, 60_000)
        if (!rl.allowed) return null

        const bf = checkBruteForce(credentials.email, 5, 900_000)
        if (bf.locked) return null

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.hashedPassword) {
          recordFailedAttempt(credentials.email, 5, 900_000)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword)
        if (!isValid) {
          recordFailedAttempt(credentials.email, 5, 900_000)
          return null
        }

        resetBruteForce(credentials.email)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          role: user.role,
          reputation: user.reputation,
          level: user.level,
          levelTitle: user.levelTitle,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.reputation = user.reputation
        token.level = user.level
        token.levelTitle = user.levelTitle
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.username = token.username
        session.user.role = token.role
        session.user.reputation = token.reputation
        session.user.level = token.level
        session.user.levelTitle = token.levelTitle
      }
      return session
    },
  },
}