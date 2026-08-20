import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import { SettingsForm } from "@/components/settings-form"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      defaultAnonymous: true,
      showInLeaderboard: true,
    },
  })

  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Paramètres" description="Gérez votre compte, vos notifications et votre confidentialité." />
      <SettingsForm user={user} />
    </div>
  )
}