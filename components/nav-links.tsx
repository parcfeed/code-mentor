"use client"

import { LayoutDashboard, Code2, Trophy, Shield, User, Settings, PlusCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const baseNavItems = [
  { href: "/dashboard",    label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/snippets",     label: "Snippets",         icon: Code2 },
  { href: "/snippets/new", label: "Nouvel Snippet",   icon: PlusCircle },
  { href: "/leaderboard",  label: "Classement",       icon: Trophy },
  { href: "/profile",      label: "Profil",           icon: User },
  { href: "/settings",     label: "Paramètres",       icon: Settings },
]

const moderationItem = { href: "/moderation", label: "Modération", icon: Shield }

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const isModerator = role === "moderator" || role === "admin"
  const navItems = isModerator
    ? [...baseNavItems.slice(0, 4), moderationItem, ...baseNavItems.slice(4)]
    : baseNavItems

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active =
          item.href === "/snippets"
            ? pathname === "/snippets"
            : pathname === item.href || pathname.startsWith(item.href + "/")
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
