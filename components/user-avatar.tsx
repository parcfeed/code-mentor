"use client"

import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function UserAvatar({
  name,
  className,
  username,
}: {
  name: string
  className?: string
  username?: string
}) {
  const isAnon = name.toLowerCase() === "anonymous"
  const avatar = (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback
        className={cn(
          "text-xs font-medium",
          isAnon ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {isAnon ? "?" : initials(name)}
      </AvatarFallback>
    </Avatar>
  )

  if (!username || isAnon) return avatar

  return (
    <Link
      href={`/profile/${username}`}
      className="inline-flex shrink-0 rounded-full transition-opacity hover:opacity-80"
      onClick={(e) => e.stopPropagation()}
    >
      {avatar}
    </Link>
  )
}
