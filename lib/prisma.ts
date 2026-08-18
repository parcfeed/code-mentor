import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "./generated/prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createAdapter() {
  const url = process.env.DATABASE_URL!
  // Supabase requires SSL — ensure the connection string includes sslmode=require
  const sslUrl = url.includes("sslmode=") ? url : `${url}${url.includes("?") ? "&" : "?"}sslmode=require`
  return new PrismaPg({ connectionString: sslUrl })
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: createAdapter() })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
