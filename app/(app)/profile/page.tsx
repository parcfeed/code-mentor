import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function ProfileIndexPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.username) {
    redirect(`/profile/${session.user.username}`)
  }
  redirect("/login")
}