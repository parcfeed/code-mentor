"use client"

import { Search, SlidersHorizontal, FileCode2 } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { SnippetCard } from "@/components/snippet-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DIFFICULTIES, LANGUAGES } from "@/lib/types"
import type { Snippet } from "@/lib/types"

const PAGE_SIZE = 6

export function SnippetsBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery)
  const [language, setLanguage] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ snippets: Snippet[]; total: number }>({ snippets: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useMemo(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (language !== "all") params.set("language", language)
    if (difficulty !== "all") params.set("difficulty", difficulty)
    if (status !== "all") params.set("status", status)
    params.set("page", String(page))
    params.set("pageSize", String(PAGE_SIZE))

    fetch(`/api/snippets?${params}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData({
            snippets: json.data.snippets,
            total: json.data.total,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [query, language, difficulty, status, page])

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))
  const current = Math.min(page, totalPages)

  function resetPage<T>(setter: (v: T) => void, fallback?: T) {
    return (v: T | null) => {
      setter(v ?? (fallback as T))
      setPage(1)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
              placeholder="Rechercher par titre ou langage..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-3">
            <Select value={language} onValueChange={resetPage<string>(setLanguage, "all")}>
              <SelectTrigger className="w-full min-w-36 sm:w-44">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                <SelectValue placeholder="Langage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les langages</SelectItem>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficulty} onValueChange={resetPage<string>(setDifficulty, "all")}>
              <SelectTrigger className="w-full min-w-36 sm:w-44">
                <SelectValue placeholder="Difficulté" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous niveaux</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={status} onValueChange={resetPage<string>(setStatus, "all")}>
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="open">À relire</TabsTrigger>
            <TabsTrigger value="reviewed">Relus</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <p className="mt-5 mb-4 text-sm text-muted-foreground">
        {loading ? "Chargement..." : `${data.total} Snippet${data.total > 1 ? "s" : ""} trouvé${data.total > 1 ? "s" : ""}`}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Chargement des Snippets...</div>
      ) : data.snippets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.snippets.map((s) => (
            <SnippetCard key={s.id} snippet={s} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileCode2 className="size-6" />
          </span>
          <h3 className="mt-4 font-medium">Aucun Snippet ne correspond à vos filtres</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">Essayez de modifier votre recherche ou soyez le premier à soumettre un Snippet.</p>
          <Button render={<Link href="/snippets/new" />} className="mt-5">Soumettre un Snippet</Button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Précédent</Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button key={p} variant={p === current ? "default" : "outline"} size="icon" className="size-9" onClick={() => setPage(p)}>{p}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={current === totalPages} onClick={() => setPage(current + 1)}>Suivant</Button>
        </div>
      )}
    </div>
  )
}
