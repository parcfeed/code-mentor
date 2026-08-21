"use client"

import { Loader2, EyeOff, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { CodeEditor } from "@/components/code-editor"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DIFFICULTIES,
  LANGUAGES,
  monacoLanguageMap,
  type Language,
} from "@/lib/types"

const starter = "# Paste or write your code here\ndef greet(name):\n    return \"Hello, \" + name\n"

export function CreateSnippetForm() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [language, setLanguage] = useState<Language>("Python")
  const [difficulty, setDifficulty] = useState("Beginner")
  const [anonymous, setAnonymous] = useState(false)
  const [code, setCode] = useState(starter)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setAnonymous(json.data.defaultAnonymous ?? false)
        }
      })
      .catch((err) => console.error("Error fetching user settings", err))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !code.trim()) {
      toast.error("Veuillez ajouter un titre et du code avant de publier.")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, code, language, difficulty, isAnonymous: anonymous }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? "Échec de la publication")
        return
      }
      toast.success("Snippet publié ! Vos pairs peuvent maintenant le relire.")
      router.push("/snippets")
    } catch {
      toast.error("Échec de la publication du snippet")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="gap-0 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="font-mono text-xs text-muted-foreground">
              snippet.{language === "Python" ? "py" : monacoLanguageMap[language]}
            </span>
            <span className="text-xs text-muted-foreground">{code.split("\n").length} lignes</span>
          </div>
          <CodeEditor value={code} onChange={setCode} language={monacoLanguageMap[language]} height={480} />
        </Card>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="size-3.5" /> Propulsé par Monaco Editor — le moteur derrière VS Code.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="gap-4 p-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ex. Implémentation d'une recherche binaire" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Sur quoi les relecteurs devraient-ils se concentrer ?" rows={3} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Langage</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
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
          <div className="flex flex-col gap-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "Beginner")}>
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
        </Card>

        <Card className="gap-0 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <EyeOff className="size-4" />
              </span>
              <div>
                <Label htmlFor="anon" className="cursor-pointer">Publier anonymement</Label>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Cachez votre identité pour obtenir des retours impartiaux.</p>
              </div>
            </div>
            <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Publier le snippet
          </Button>
          <p className="text-center text-xs text-muted-foreground">En publiant, vous acceptez que votre code soit partagé sous licence MIT.</p>
        </div>
      </div>
    </form>
  )
}
