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
}: {
  name: string
  className?: string
}) {
  const isAnon = name.toLowerCase() === "anonymous"
  return (
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
}
