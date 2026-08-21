"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LANGUAGES } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LeaderboardFilter({ currentLanguage }: { currentLanguage: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleLanguageChange(lang: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (lang === "all") {
      params.delete("language")
    } else {
      params.set("language", lang)
    }
    router.push(`/leaderboard?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Filtrer par langage :</span>
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tous les langages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les langages</SelectItem>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
