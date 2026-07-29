import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { SnippetsBrowser } from "@/components/snippets-browser"
import { Button } from "@/components/ui/button"

export default async function SnippetsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Snippets"
        description="Parcourez le code partagé par la communauté et laissez une review utile."
        action={
          <Button render={<Link href="/snippets/new" />}>Nouvel Snippet</Button>
        }
      />
      <SnippetsBrowser initialQuery={q ?? ""} />
    </div>
  )
}
