"use client"

import { Menu, Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { NavLinks } from "@/components/nav-links"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const showSearch = pathname === "/dashboard"

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

      {showSearch && (
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
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
      </div>
    </header>
  )
}
