import { describe, it, expect } from 'vitest'
import { timeAgo } from '@/lib/utils'

describe('timeAgo()', () => {
  it('retourne "il y a 0 min" pour une date à l\'instant présent', () => {
    const now = new Date()
    const result = timeAgo(now.toISOString())
    expect(result).toBe('il y a 0 min')
  })

  it('retourne "il y a 30 min" pour une date il y a 30 minutes', () => {
    const date = new Date(Date.now() - 30 * 60 * 1000)
    const result = timeAgo(date.toISOString())
    expect(result).toBe('il y a 30 min')
  })

  it('retourne "il y a 1 h" pour une date il y a 1h30', () => {
    const date = new Date(Date.now() - 90 * 60 * 1000)
    const result = timeAgo(date.toISOString())
    expect(result).toBe('il y a 1 h')
  })

  it('retourne "il y a 2 j" pour une date il y a 2 jours', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const result = timeAgo(date.toISOString())
    expect(result).toBe('il y a 2 j')
  })

  it('retourne une valeur en "min" pour une date dans le futur (branche < 60 activée)', () => {
    // La fonction ne clamp pas les valeurs négatives, mais la branche "mins < 60" est quand
    // même activée puisque Math.floor(négatif) < 60.
    const future = new Date(Date.now() + 10 * 60 * 1000)
    const result = timeAgo(future.toISOString())
    expect(result).toMatch(/^il y a -?\d+ min$/)
  })
})
