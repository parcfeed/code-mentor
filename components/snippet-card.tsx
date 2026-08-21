"use client"
 
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MessageSquare, EyeOff, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DifficultyBadge, LanguageBadge, RatingStars } from "@/components/meta-badges"
import { UserAvatar } from "@/components/user-avatar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CodeEditor } from "@/components/code-editor"
import { LANGUAGES, DIFFICULTIES, monacoLanguageMap } from "@/lib/types"
import type { Snippet } from "@/lib/types"
import { timeAgo } from "@/lib/utils"

export function SnippetCard({
  snippet,
  isEditable = false,
  onRefresh,
}: {
  snippet: Snippet
  isEditable?: boolean
  onRefresh?: () => void
}) {
  const router = useRouter()
  const authorName = snippet.isAnonymous ? "Anonyme" : snippet.author.name

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  
  const [title, setTitle] = useState(snippet.title)
  const [description, setDescription] = useState(snippet.description)
  const [code, setCode] = useState(snippet.code)
  const [language, setLanguage] = useState(snippet.language)
  const [difficulty, setDifficulty] = useState(snippet.difficulty)
  const [anonymous, setAnonymous] = useState(snippet.isAnonymous)

  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !code.trim()) {
      toast.error("Veuillez saisir un titre et du code.")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          code: code.trim(),
          language,
          difficulty,
          isAnonymous: anonymous,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la modification")
        return
      }
      toast.success("Snippet mis à jour avec succès.")
      setEditOpen(false)
      if (onRefresh) onRefresh()
      else router.refresh()
    } catch {
      toast.error("Erreur lors de la modification")
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSubmit() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/snippets/${snippet.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la suppression")
        return
      }
      toast.success("Snippet supprimé avec succès.")
      setDeleteOpen(false)
      if (onRefresh) onRefresh()
      else router.refresh()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="group block cursor-pointer"
        onClick={() => router.push(`/snippets/${snippet.id}`)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/snippets/${snippet.id}`) }}
      >
        <Card className="h-full gap-0 p-5 transition-all hover:ring-primary/40 hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <LanguageBadge language={snippet.language} />
              <span className="text-muted-foreground/40">·</span>
              <DifficultyBadge difficulty={snippet.difficulty} />
            </div>
            {snippet.status === "open" ? (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                À relire
              </span>
            ) : (
              <RatingStars rating={snippet.averageRating} />
            )}
          </div>

          <h3 className="mt-3 text-balance font-medium leading-snug transition-colors group-hover:text-primary">
            {snippet.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{snippet.description}</p>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <UserAvatar
                name={authorName}
                className="size-6"
                username={snippet.isAnonymous ? undefined : snippet.author.username}
              />
              {snippet.isAnonymous ? (
                <span className="text-xs text-muted-foreground">
                  {authorName} · {timeAgo(snippet.createdAt)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground hover:underline hover:text-primary transition-colors">
                    {authorName}
                  </span>
                  {" · "}
                  {timeAgo(snippet.createdAt)}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="size-3.5" />
              {snippet.reviewsCount}
            </span>
          </div>

          {isEditable && (
            <div className="mt-4 flex gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 gap-1.5"
                onClick={() => {
                  setTitle(snippet.title)
                  setDescription(snippet.description)
                  setCode(snippet.code)
                  setLanguage(snippet.language)
                  setDifficulty(snippet.difficulty)
                  setAnonymous(snippet.isAnonymous)
                  setEditOpen(true)
                }}
              >
                <Edit className="size-3.5" /> Modifier
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-3.5" /> Supprimer
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Modifier le Snippet</DialogTitle>
            <DialogDescription>Modifiez les détails ou le code de votre extrait.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre</Label>
              <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Langage</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulté</Label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-y border-border">
              <div className="space-y-0.5">
                <Label htmlFor="edit-anon" className="text-sm font-medium">Soumission anonyme</Label>
                <p className="text-xs text-muted-foreground">Masquer votre identité sur ce snippet.</p>
              </div>
              <Switch id="edit-anon" checked={anonymous} onCheckedChange={setAnonymous} />
            </div>
            <div className="space-y-2">
              <Label>Code source</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <CodeEditor value={code} onChange={setCode} language={monacoLanguageMap[language] ?? "plaintext"} height={250} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Supprimer le Snippet</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet extrait de code ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteSubmit} disabled={deleting}>
              {deleting ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
