export function computeLevel(reputation: number): { level: number; levelTitle: string } {
  const level = Math.min(10, 1 + Math.floor(reputation / 500))
  const titleMap: Record<number, string> = {
    1: "Newcomer",
    2: "Newcomer",
    3: "Contributor",
    4: "Contributor",
    5: "Reviewer",
    6: "Reviewer",
    7: "Senior Reviewer",
    8: "Senior Reviewer",
    9: "Lead Reviewer",
    10: "Lead Reviewer",
  }
  return { level, levelTitle: titleMap[level] ?? "Newcomer" }
}
