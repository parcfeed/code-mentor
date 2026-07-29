import Link from "next/link"
import { Trophy, Medal, Award, Star, MessageSquare } from "lucide-react"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default async function LeaderboardPage() {
  const session = await getServerSession(authOptions)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      reputation: true,
      level: true,
      levelTitle: true,
      _count: { select: { reviews: true } },
    },
    orderBy: { reputation: "desc" },
    take: 50,
  })

  const currentUserId = session?.user?.id

  return (
    <div>
      <PageHeader
        title="Classement"
        description="Les relecteurs les plus utiles ce mois-ci, classés par réputation gagnée."
      />

      {users.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-6">
            {[users[1] ?? null, users[0] ?? null, users[2] ?? null].map((user, i) => {
              if (!user) return <div key={`empty-${i}`} />
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3
              const heights = { 1: "sm:pt-2", 2: "sm:pt-8", 3: "sm:pt-10" }
              return (
                <Card
                  key={user.id}
                  className={cn(
                    "items-center gap-2 p-4 text-center sm:p-6",
                    rank === 1 && "border-primary/40 bg-primary/[0.04]",
                    heights[rank as 1 | 2 | 3],
                  )}
                >
                  <div className="relative">
                    <UserAvatar name={user.name} className={cn("size-14 sm:size-16", rank === 1 && "size-16 sm:size-20")} />
                    <span
                      className={cn(
                        "absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full text-xs font-bold text-primary-foreground",
                        rank === 1 ? "bg-amber-400" : rank === 2 ? "bg-slate-400" : "bg-amber-700",
                      )}
                    >
                      {rank}
                    </span>
                  </div>
                  {rank === 1 && <Trophy className="size-5 text-amber-400" />}
                  <Link href={`/profile/${user.username}`} className="text-sm font-semibold hover:text-primary">
                    {user.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{user.levelTitle}</p>
                  <p className="text-lg font-bold text-primary">{user.reputation.toLocaleString()}</p>
                </Card>
              )
            })}
          </div>

          <Card className="gap-0 overflow-hidden p-0">
            <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]">
              <span>Rang</span>
              <span>Relecteur</span>
              <span className="hidden justify-end sm:flex">Reviews</span>
              <span className="hidden justify-end sm:flex">Niveau</span>
              <span className="flex justify-end">Réput.</span>
            </div>
            <ul>
              {users.map((user, i) => (
                <li
                  key={user.id}
                  className={cn(
                    "grid grid-cols-[3rem_1fr_auto] items-center gap-4 px-5 py-3 text-sm sm:grid-cols-[3rem_1fr_6rem_6rem_6rem]",
                    i !== users.length - 1 && "border-b border-border",
                    user.id === currentUserId && "bg-primary/[0.04]",
                  )}
                >
                  <span className="flex items-center gap-1 font-medium text-muted-foreground">
                    {i < 3 && <Medal className={cn("size-4", i === 0 ? "text-amber-400" : i === 1 ? "text-slate-400" : "text-amber-700")} />}
                    {i + 1}
                  </span>
                  <Link href={`/profile/${user.username}`} className="flex min-w-0 items-center gap-3">
                    <UserAvatar name={user.name} className="size-8" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:text-primary">
                        {user.name}
                        {user.id === currentUserId && (
                          <Badge variant="outline" className="ml-2 rounded border-primary/30 bg-primary/10 text-primary">
                            Vous
                          </Badge>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
                    </span>
                  </Link>
                  <span className="hidden items-center justify-end gap-1 text-muted-foreground sm:flex">
                    <MessageSquare className="size-3.5" />
                    {user._count.reviews}
                  </span>
                  <span className="hidden items-center justify-end gap-1 text-muted-foreground sm:flex">
                    <Award className="size-3.5" /> {user.level}
                  </span>
                  <span className="flex items-center justify-end gap-1 font-semibold text-primary">
                    <Star className="size-3.5 fill-primary" />
                    {user.reputation.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}