"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

function ToggleRow({
  title,
  description,
  defaultChecked,
  checked,
  onCheckedChange,
}: {
  title: string
  description: string
  defaultChecked?: boolean
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} defaultChecked={defaultChecked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function SettingsForm({
  user,
}: {
  user: { name: string; username: string; email: string; image: string | null; bio: string; defaultAnonymous: boolean; showInLeaderboard: boolean }
}) {
  const [name, setName] = useState(user.name)
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [bio, setBio] = useState(user.bio)
  const [defaultAnonymous, setDefaultAnonymous] = useState(user.defaultAnonymous)
  const [showInLeaderboard, setShowInLeaderboard] = useState(user.showInLeaderboard)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()

    // Validations côté client
    if (!name.trim()) {
      toast.error("Le nom d'affichage ne peut pas être vide")
      return
    }
    if (!/^[a-z0-9._-]{3,30}$/i.test(username)) {
      toast.error("Le nom d'utilisateur doit contenir entre 3 et 30 caractères (lettres, chiffres, points, tirets)")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("L'adresse e-mail n'est pas valide")
      return
    }
    if (bio.length > 500) {
      toast.error("La bio ne peut pas dépasser 500 caractères")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, bio, email, defaultAnonymous, showInLeaderboard }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la sauvegarde")
        return
      }
      toast.success("Paramètres sauvegardés.")
    } catch {
      toast.error("Échec de la sauvegarde des paramètres")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-semibold">Profil</h2>
        <p className="text-sm text-muted-foreground">Ces informations sont affichées sur votre profil public.</p>
        <Separator className="my-5" />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nom d'affichage</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold">Confidentialité</h2>
        <p className="text-sm text-muted-foreground">Contrôlez la façon dont votre travail est partagé.</p>
        <Separator className="my-3" />
        <div className="divide-y divide-border">
          <ToggleRow
            title="Publier les Snippets anonymement par défaut"
            description="Cachez votre nom sur les nouveaux Snippets, sauf si vous choisissez l'inverse."
            checked={defaultAnonymous}
            onCheckedChange={setDefaultAnonymous}
          />
          <ToggleRow
            title="M'afficher dans le classement"
            description="Apparaître dans les classements publics de réputation."
            checked={showInLeaderboard}
            onCheckedChange={setShowInLeaderboard}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => { setName(user.name); setUsername(user.username); setEmail(user.email); setBio(user.bio); setDefaultAnonymous(user.defaultAnonymous); setShowInLeaderboard(user.showInLeaderboard) }}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>{saving ? "Sauvegarde..." : "Enregistrer"}</Button>
      </div>
    </form>
  )
}
