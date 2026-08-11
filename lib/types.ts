// ─── Types de base ────────────────────────────────────────────────────────────

export type Language =
  | "Python"
  | "JavaScript"
  | "TypeScript"
  | "Java"
  | "C++"
  | "Go"
  | "Rust"
  | "Ruby"
  | "PHP"
  | "C#"

export type Difficulty = "Beginner" | "Intermediate" | "Advanced"

export type Badge = {
  id: string
  label: string
  description: string
  tone: "emerald" | "neutral"
}

export type User = {
  id: string
  name: string
  username: string
  email: string
  reputation: number
  level: number
  levelTitle: string
  bio: string
  joinedAt: string
  snippetsCount: number
  reviewsCount: number
  badges: Badge[]
}

export type LineComment = {
  id: string
  line: number
  author: Pick<User, "id" | "name">
  content: string
  createdAt: string
}

export type Review = {
  id: string
  snippetId: string
  reviewer: Pick<User, "id" | "name" | "username" | "reputation">
  summary: string
  rating: number
  upvotes: number
  downvotes: number
  createdAt: string
  lineComments: LineComment[]
}

export type Snippet = {
  id: string
  title: string
  code: string
  language: string
  difficulty: Difficulty
  isAnonymous: boolean
  author: Pick<User, "id" | "name" | "username">
  createdAt: string
  reviewsCount: number
  averageRating: number
  status: "open" | "reviewed"
  description: string
}

export type Report = {
  id: string
  reviewSnippet: string
  reason: string
  reportedContent: string
  reporter: Pick<User, "id" | "name">
  target: Pick<User, "id" | "name">
  createdAt: string
  status: "pending" | "resolved" | "dismissed"
  severity: "low" | "medium" | "high"
}

// ─── Constantes ───────────────────────────────────────────────────────────────

export const LANGUAGES: Language[] = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Java",
  "C++",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "C#",
]

export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"]

export const REVIEW_CHECKLIST = [
  "Le code est lisible et bien structuré",
  "La logique est correcte et gère les cas importants",
  "Le code respecte les bonnes pratiques du langage",
  "Le feedback est constructif et bienveillant",
]

export const languageColors: Record<string, string> = {
  Python: "#3572A5",
  JavaScript: "#F1E05A",
  TypeScript: "#3178C6",
  Java: "#B07219",
  "C++": "#F34B7D",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C#": "#178600",
}

export const monacoLanguageMap: Record<string, string> = {
  Python: "python",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Java: "java",
  "C++": "cpp",
  Go: "go",
  Rust: "rust",
  Ruby: "ruby",
  PHP: "php",
  "C#": "csharp",
}
