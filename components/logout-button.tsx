"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  return (
    <div className="m-3 mt-auto">
      <Button
        variant="outline"
        className="w-full justify-start gap-2.5 border px-3 text-muted-foreground hover:text-destructive hover:border-destructive/40"
        onClick={() => signOut({ callbackUrl: "/" })}
      >
        <LogOut className="size-4" /> Déconnexion
      </Button>
    </div>
  )
}