import { CreateSnippetForm } from "@/components/create-snippet-form"
import { PageHeader } from "@/components/page-header"

export default function NewSnippetPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Soumettre un Snippet"
        description="Partagez votre code et recevez des retours détaillés, ligne par ligne, de la part de vos pairs."
      />
      <CreateSnippetForm />
    </div>
  )
}
