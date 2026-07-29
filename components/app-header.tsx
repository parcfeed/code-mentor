"use client"

import { Menu, Search, LogOut, User, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { NavLinks } from "@/components/nav-links"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserAvatar } from "@/components/user-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function AppHeader() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" aria-label="Ouvrir la navigation" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-16 items-center border-b border-border px-4">
              <Logo />
            </div>
            <div className="p-3">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Logo showText={false} />
      </div>

      <form
        className="relative hidden max-w-md flex-1 md:block"
        onSubmit={(e) => {
          e.preventDefault()
          const q = new FormData(e.currentTarget).get("q") as string
          router.push(q ? `/snippets?q=${encodeURIComponent(q)}` : "/snippets")
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" placeholder="Rechercher un Snippet par titre ou langage..." className="pl-9" />
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Button render={<Link href="/snippets/new" />} size="sm" className="hidden sm:inline-flex">
          Nouvel Snippet
        </Button>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full outline-none ring-ring focus-visible:ring-2"
              aria-label="Menu du compte"
            >
              <UserAvatar name={user.name ?? ""} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">@{user.username}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={`/profile/${user.username}`} />}>
                <User className="size-4" /> Profil
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings className="size-4" /> Paramètres
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="size-4" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
