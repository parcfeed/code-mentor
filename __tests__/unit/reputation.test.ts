import { describe, it, expect } from 'vitest'
import { computeLevel } from '@/lib/reputation'

describe('computeLevel()', () => {
  it('0 rep → level 1, title "Newcomer"', () => {
    const result = computeLevel(0)
    expect(result.level).toBe(1)
    expect(result.levelTitle).toBe('Newcomer')
  })

  it('499 rep → level 1, title "Newcomer"', () => {
    const result = computeLevel(499)
    expect(result.level).toBe(1)
    expect(result.levelTitle).toBe('Newcomer')
  })

  it('500 rep → level 2, title "Newcomer"', () => {
    const result = computeLevel(500)
    expect(result.level).toBe(2)
    expect(result.levelTitle).toBe('Newcomer')
  })

  it('999 rep → level 2, title "Newcomer"', () => {
    const result = computeLevel(999)
    expect(result.level).toBe(2)
    expect(result.levelTitle).toBe('Newcomer')
  })

  it('1000 rep → level 3, title "Contributor"', () => {
    const result = computeLevel(1000)
    expect(result.level).toBe(3)
    expect(result.levelTitle).toBe('Contributor')
  })

  it('1500 rep → level 4, title "Contributor"', () => {
    const result = computeLevel(1500)
    expect(result.level).toBe(4)
    expect(result.levelTitle).toBe('Contributor')
  })

  it('2000 rep → level 5, title "Reviewer"', () => {
    const result = computeLevel(2000)
    expect(result.level).toBe(5)
    expect(result.levelTitle).toBe('Reviewer')
  })

  it('2500 rep → level 6, title "Reviewer"', () => {
    const result = computeLevel(2500)
    expect(result.level).toBe(6)
    expect(result.levelTitle).toBe('Reviewer')
  })

  it('3000 rep → level 7, title "Senior Reviewer"', () => {
    const result = computeLevel(3000)
    expect(result.level).toBe(7)
    expect(result.levelTitle).toBe('Senior Reviewer')
  })

  it('3500 rep → level 8, title "Senior Reviewer"', () => {
    const result = computeLevel(3500)
    expect(result.level).toBe(8)
    expect(result.levelTitle).toBe('Senior Reviewer')
  })

  it('4000 rep → level 9, title "Lead Reviewer"', () => {
    const result = computeLevel(4000)
    expect(result.level).toBe(9)
    expect(result.levelTitle).toBe('Lead Reviewer')
  })

  it('4500 rep → level 10, title "Lead Reviewer"', () => {
    const result = computeLevel(4500)
    expect(result.level).toBe(10)
    expect(result.levelTitle).toBe('Lead Reviewer')
  })

  it('9999 rep → level 10 (plafonné), title "Lead Reviewer"', () => {
    const result = computeLevel(9999)
    expect(result.level).toBe(10)
    expect(result.levelTitle).toBe('Lead Reviewer')
  })
})
