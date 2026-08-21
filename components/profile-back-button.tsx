"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function ProfileBackButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Retour
    </Button>
  )
}
