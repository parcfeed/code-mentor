import { describe, it, expect } from 'vitest'
import { slugifyName } from '@/lib/generate-username'

describe('slugifyName()', () => {
  it('"Amina Cherif" → "amina.cherif"', () => {
    expect(slugifyName('Amina Cherif')).toBe('amina.cherif')
  })

  it('"Léa Müller" → "lea.muller" (accents normalisés)', () => {
    expect(slugifyName('Léa Müller')).toBe('lea.muller')
  })

  it('"Jean-Pierre" → "jean.pierre"', () => {
    expect(slugifyName('Jean-Pierre')).toBe('jean.pierre')
  })

  it('"" (vide) → ""', () => {
    expect(slugifyName('')).toBe('')
  })

  it('"123 Test!!!" → "123.test"', () => {
    expect(slugifyName('123 Test!!!')).toBe('123.test')
  })

  it('nom de 50 chars → tronqué à 30 caractères maximum', () => {
    const longName = 'Abcdefghij Klmnopqrst Uvwxyzabcd' // 32 chars
    const result = slugifyName(longName)
    expect(result.length).toBeLessThanOrEqual(30)
  })

  it('pas de points en début ou en fin', () => {
    // " hello " → les espaces deviennent des points, puis strippés
    expect(slugifyName('  hello  ')).toBe('hello')
  })

  it('"Élodie Dupont" → "elodie.dupont"', () => {
    expect(slugifyName('Élodie Dupont')).toBe('elodie.dupont')
  })
})
