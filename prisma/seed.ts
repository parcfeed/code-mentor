import { prisma } from "../lib/prisma"

const BADGES = [
  // Badges généraux
  { id: "first-review",  label: "First Review",          description: "Completed your first peer review",                          tone: "neutral"  as const },
  { id: "mentor",        label: "Mentor",                 description: "Helped 50+ students improve their code",                    tone: "emerald"  as const },
  { id: "fast-feedback", label: "Fast Feedback",          description: "Average response time under 2 hours",                       tone: "neutral"  as const },
  { id: "clean-code",    label: "Clean Code Advocate",    description: "Consistently promotes readable, maintainable code",         tone: "emerald"  as const },
  { id: "kind-reviewer", label: "Kind Reviewer",          description: "Recognized for constructive, bienveillant feedback",        tone: "emerald"  as const },

  // Badges par langage (10+ langages)
  { id: "python-expert", label: "Python Expert",          description: "Delivered 25+ high-quality Python reviews",                 tone: "emerald"  as const },
  { id: "js-guru",       label: "JavaScript Guru",        description: "Top-rated reviewer in JavaScript",                         tone: "emerald"  as const },
  { id: "ts-expert",     label: "TypeScript Expert",      description: "Delivered 25+ high-quality TypeScript reviews",            tone: "emerald"  as const },
  { id: "java-expert",   label: "Java Expert",            description: "Delivered 25+ high-quality Java reviews",                  tone: "emerald"  as const },
  { id: "cpp-expert",    label: "C++ Expert",             description: "Delivered 25+ high-quality C++ reviews",                   tone: "emerald"  as const },
  { id: "c-expert",      label: "C Expert",               description: "Delivered 25+ high-quality C reviews",                     tone: "emerald"  as const },
  { id: "rust-expert",   label: "Rust Expert",            description: "Delivered 25+ high-quality Rust reviews",                  tone: "emerald"  as const },
  { id: "go-expert",     label: "Go Expert",              description: "Delivered 25+ high-quality Go reviews",                    tone: "emerald"  as const },
  { id: "kotlin-expert", label: "Kotlin Expert",          description: "Delivered 25+ high-quality Kotlin reviews",                tone: "emerald"  as const },
  { id: "swift-expert",  label: "Swift Expert",           description: "Delivered 25+ high-quality Swift reviews",                 tone: "emerald"  as const },
  { id: "php-expert",    label: "PHP Expert",             description: "Delivered 25+ high-quality PHP reviews",                   tone: "emerald"  as const },
  { id: "ruby-expert",   label: "Ruby Expert",            description: "Delivered 25+ high-quality Ruby reviews",                  tone: "emerald"  as const },
  { id: "csharp-expert", label: "C# Expert",              description: "Delivered 25+ high-quality C# reviews",                   tone: "emerald"  as const },
  { id: "sql-expert",    label: "SQL Expert",             description: "Delivered 25+ high-quality SQL reviews",                   tone: "emerald"  as const },
]

async function main() {
  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: { label: badge.label, description: badge.description, tone: badge.tone },
      create: badge,
    })
  }
  console.log(`✅ ${BADGES.length} badges seeded`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())