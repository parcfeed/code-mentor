import { Quote } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-sidebar p-10 lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <div className="max-w-md">
          <Quote className="size-8 text-primary" />
          <p className="mt-4 text-pretty text-xl font-medium leading-relaxed">
            Les Reviews ligne par ligne sur CodeMentor m'ont plus appris sur le code propre en un mois
            qu'un semestre entier de cours.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Sofia Reyes · Étudiante en informatique</p>
        </div>
        <div className="flex gap-8 text-sm">
          <div>
            <p className="text-2xl font-semibold tracking-tight text-primary">500+</p>
            <p className="text-muted-foreground">Snippets relus</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-primary">80%</p>
            <p className="text-muted-foreground">Reviews constructives</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="lg:hidden">
            <Logo />
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
