"use client"

import { signIn } from "next-auth/react"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const isRegister = mode === "register"

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get("email") as string
    const password = form.get("password") as string

    if (isRegister) {
      const name = form.get("name") as string
      try {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        })

        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error?.message || "Échec de l'inscription")
          setLoading(false)
          return
        }

        const result = await signIn("credentials", { email, password, redirect: false })
        if (result?.error) {
          toast.error("Un problème est survenu après l'inscription")
          setLoading(false)
          return
        }

        toast.success("Compte créé. Bienvenue sur CodeMentor !")
        router.push("/dashboard")
      } catch {
        toast.error("Erreur réseau. Veuillez réessayer.")
        setLoading(false)
      }
    } else {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        toast.error("Email ou mot de passe invalide")
        setLoading(false)
        return
      }

      toast.success("Bon retour parmi nous !")
      router.push("/dashboard")
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isRegister ? "Créer votre compte" : "Bon retour"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isRegister
            ? "Commencez à donner et recevoir des Reviews constructives."
            : "Connectez-vous pour continuer à relire avec vos pairs."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isRegister && (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" name="name" placeholder="Amina Cherif" required autoComplete="name" />
            </div>
          </>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@student.edu"
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              className="pr-9"
              autoComplete={isRegister ? "new-password" : "current-password"}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full w-8 text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
        </div>

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {isRegister ? "Créer un compte" : "Se connecter"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isRegister ? "Vous avez déjà un compte ? " : "Vous n'avez pas de compte ? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-medium text-primary hover:underline">
          {isRegister ? "Se connecter" : "S'inscrire"}
        </Link>
      </p>
    </div>
  )
}
