import { Quote } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col bg-sidebar p-10 lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <Quote className="mx-auto size-8 text-primary" />
            <p className="mt-4 text-balance text-2xl font-semibold leading-relaxed">
              Améliorez votre code grâce aux retours de vos pairs.
            </p>
            <p className="mt-3 text-muted-foreground">
              Soumettez vos snippets, réalisez des reviews et progressez ensemble.
            </p>
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
