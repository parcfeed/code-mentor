import {
  ArrowRight,
  MessageSquareCode,
  ShieldCheck,
  Trophy,
  EyeOff,
  Languages,
  GitPullRequestArrow,
  Check,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: GitPullRequestArrow,
    title: "Relecture ligne par ligne",
    desc: "Commentez n'importe quelle ligne comme sur une Pull Request GitHub. Précis, contextuel et facile à suivre.",
  },
  {
    icon: Languages,
    title: "10+ langages",
    desc: "Coloration syntaxique pour Python, JavaScript, TypeScript, Java, Go, Rust et plus via Monaco Editor.",
  },
  {
    icon: EyeOff,
    title: "Soumissions anonymes",
    desc: "Partagez du code sans métadonnées personnelles pour obtenir des retours impartiaux, sans jugement.",
  },
  {
    icon: Trophy,
    title: "Réputation & badges",
    desc: "Gagnez de la réputation et des badges comme Expert Python ou Défenseur du code propre.",
  },
  {
    icon: ShieldCheck,
    title: "Modération collective",
    desc: "Le signalement communautaire et une checklist de relecture gardent les retours constructifs et bienveillants.",
  },
  {
    icon: MessageSquareCode,
    title: "Retours rapides",
    desc: "Un tableau de bord des Snippets en attente de relecture vous garantit des réponses rapides et utiles.",
  },
]

const stats = [
  { value: "500+", label: "Snippets relus" },
  { value: "80%", label: "Relectures constructives" },
  { value: "25%", label: "Retours plus rapides" },
  { value: "10+", label: "Langages supportés" },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              Comment ça marche
            </a>
            <Link href="/leaderboard" className="transition-colors hover:text-foreground">
              Classement
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button render={<Link href="/login" />} variant="ghost" size="sm" className="hidden sm:inline-flex">
              Connexion
            </Button>
            <Button render={<Link href="/register" />} size="sm">
              Commencer
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 md:px-6 md:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 text-primary">
                Relecture de code par les pairs pour étudiants
              </Badge>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Écrivez un meilleur code grâce aux retours de vos pairs
              </h1>
              <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                CodeMentor est une plateforme collaborative où les étudiants soumettent des Snippets de code
                et reçoivent des relectures détaillées et constructives. Apprenez plus vite, sans jugement.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button render={<Link href="/register" />} size="lg">
                  Commencer à relire <ArrowRight className="size-4" />
                </Button>
                <Button render={<Link href="/dashboard" />} size="lg" variant="outline">
                  Explorer la démo
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Gratuit pour les étudiants · Pas de carte bancaire · Snippets sous licence MIT
              </p>
            </div>

            <HeroPreview />
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 border-t border-border pt-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-semibold tracking-tight">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-tight">
              Tout ce dont vous avez besoin pour relire du code ensemble
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Une boîte à outils inspirée de GitHub, Linear et VS Code — conçue pour la façon dont les étudiants apprennent.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon
              return (
                <Card key={f.title} className="p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-medium">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </Card>
              )
            })}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight">De la soumission à la réputation</h2>
              <p className="mt-3 text-muted-foreground">Quatre étapes simples animent tout le processus de relecture.</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-4">
              {[
                { n: "01", t: "Soumettre un Snippet", d: "Collez votre code, choisissez un langage et une difficulté, restez anonyme si vous le souhaitez." },
                { n: "02", t: "Recevoir une relecture", d: "Les pairs laissent des commentaires ligne par ligne et un résumé constructif." },
                { n: "03", t: "Voter & discuter", d: "Votez pour les relectures les plus utiles afin que les meilleurs retours émergent." },
                { n: "04", t: "Gagner en réputation", d: "Les bons relecteurs gagnent en réputation, montent en niveau et obtiennent des badges." },
              ].map((step) => (
                <div key={step.n}>
                  <span className="font-mono text-sm text-primary">{step.n}</span>
                  <h3 className="mt-2 font-medium">{step.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <Card className="items-center gap-0 p-10 text-center md:p-16">
            <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              Prêt à faire passer votre code au niveau supérieur ?
            </h2>
            <p className="mt-4 max-w-md text-pretty text-muted-foreground">
              Rejoignez une communauté d'étudiants qui s'entraident pour écrire un code plus propre et plus réfléchi.
            </p>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Conçu pour être constructif", "Option anonyme", "Gratuit pour les étudiants"].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
            <Button render={<Link href="/register" />} size="lg" className="mt-8">
              Créer votre compte <ArrowRight className="size-4" />
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <Logo />
          <p>Conçu pour les étudiants · Sous licence MIT · Projet de fin d'études</p>
        </div>
      </footer>
    </div>
  )
}

function HeroPreview() {
  const lines = [
    "def fibonacci(n):",
    "    if n <= 0:",
    "        return 0",
    "    result = []",
    "    a, b = 0, 1",
    "    for i in range(n):",
    "        result.append(a)",
    "        a, b = b, a + b",
    "    return result[-1]",
  ]
  return (
    <Card className="gap-0 p-0 shadow-xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="size-3 rounded-full bg-rose-400/70" />
        <span className="size-3 rounded-full bg-amber-400/70" />
        <span className="size-3 rounded-full bg-primary/70" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">fibonacci.py</span>
        <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          En attente
        </span>
      </div>
      <div className="overflow-hidden font-mono text-[13px] leading-6">
        {lines.map((line, i) => (
          <div key={i}>
            <div className="flex hover:bg-muted/50">
              <span className="w-10 shrink-0 select-none pr-3 text-right text-muted-foreground/50">{i + 1}</span>
              <code className="whitespace-pre text-foreground/90">{line}</code>
            </div>
            {i === 3 && (
              <div className="border-y border-border bg-muted/40 px-4 py-3 pl-10">
                <div className="flex items-start gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                    LN
                  </span>
                  <div className="text-xs leading-relaxed">
                    <span className="font-medium text-foreground">Liam Novak</span>{" "}
                    <span className="text-muted-foreground">
                      Vous construisez une liste complète mais ne retournez que la dernière valeur — ça peut être en O(1) en mémoire.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
