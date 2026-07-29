/**
 * Génère un slug à partir d'un nom complet.
 * "Amina Cherif" → "amina.cherif"
 * "Léa Müller"   → "lea.muller"
 */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 30)
}
