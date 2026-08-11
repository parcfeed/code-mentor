import Link from "next/link"
import type { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AppHeader } from "@/components/app-header"
import { Logo } from "@/components/logo"
import { LogoutButton } from "@/components/logout-button"
import { NavLinks } from "@/components/nav-links"
import { UserAvatar } from "@/components/user-avatar"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = session?.user

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks />
        </div>
        {user && (
          <Link
            href="/profile"
            className="m-3 flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
          >
            <UserAvatar name={user.name ?? ""} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.reputation?.toLocaleString() ?? "0"} rep · Lv {user.level ?? 1}
              </p>
            </div>
          </Link>
        )}
        <LogoutButton />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <AppHeader />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  )
}
