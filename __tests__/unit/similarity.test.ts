import { describe, it, expect } from 'vitest'
import { jaccardSimilarity } from '@/lib/similarly'

describe('jaccardSimilarity()', () => {
  it('deux strings identiques → 1', () => {
    const code = 'function add(a, b) { return a + b; }'
    expect(jaccardSimilarity(code, code)).toBe(1)
  })

  it('deux strings complètement différentes → 0', () => {
    const a = 'hello world foo bar baz qux'
    const b = 'alpha beta gamma delta epsilon zeta'
    // Les trigrams seront entièrement disjoints
    expect(jaccardSimilarity(a, b)).toBe(0)
  })

  it('deux strings vides → 0', () => {
    expect(jaccardSimilarity('', '')).toBe(0)
  })

  it('code avec commentaires vs même code sans commentaires → similarité > 0.5', () => {
    const codeWithComments = `
      // This function adds two numbers
      function add(a, b) {
        /* returns the sum */
        return a + b;
      }
    `
    const codeWithoutComments = `
      function add(a, b) {
        return a + b;
      }
    `
    const sim = jaccardSimilarity(codeWithComments, codeWithoutComments)
    expect(sim).toBeGreaterThan(0.5)
  })

  it('deux snippets similaires à ~80% → résultat entre 0.6 et 1.0', () => {
    const base = `
      function processItems(items) {
        const results = [];
        for (const item of items) {
          if (item.active) {
            results.push(item.value * 2);
          }
        }
        return results;
      }
    `
    // Version légèrement modifiée : même logique, quelques mots changés
    const similar = `
      function processItems(items) {
        const results = [];
        for (const item of items) {
          if (item.active) {
            results.push(item.value * 2);
          }
        }
        return results.filter(Boolean);
      }
    `
    const sim = jaccardSimilarity(base, similar)
    expect(sim).toBeGreaterThanOrEqual(0.6)
    expect(sim).toBeLessThanOrEqual(1.0)
  })

  it('une string vide vs une string non-vide → 0', () => {
    expect(jaccardSimilarity('', 'function hello() { return 42; }')).toBe(0)
  })
})
