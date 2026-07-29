const requestCounts = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, maxAttempts: number, windowMs: number): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const record = requestCounts.get(key)

  if (!record || now > record.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs }
  }

  record.count++
  const remaining = Math.max(0, maxAttempts - record.count)
  return { allowed: record.count <= maxAttempts, remaining, resetAt: record.resetAt }
}

const bruteForceStore = new Map<string, { attempts: number; lockedUntil: number | null }>()

export function checkBruteForce(key: string, maxAttempts: number, lockoutMs: number): {
  locked: boolean
  remainingAttempts: number
  lockedUntil: number | null
} {
  const now = Date.now()
  const record = bruteForceStore.get(key)

  if (!record) {
    bruteForceStore.set(key, { attempts: 0, lockedUntil: null })
    return { locked: false, remainingAttempts: maxAttempts, lockedUntil: null }
  }

  if (record.lockedUntil && now < record.lockedUntil) {
    return { locked: true, remainingAttempts: 0, lockedUntil: record.lockedUntil }
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    bruteForceStore.set(key, { attempts: 0, lockedUntil: null })
    return { locked: false, remainingAttempts: maxAttempts, lockedUntil: null }
  }

  return { locked: false, remainingAttempts: Math.max(0, maxAttempts - record.attempts), lockedUntil: null }
}

export function recordFailedAttempt(key: string, maxAttempts: number, lockoutMs: number): {
  locked: boolean
  lockedUntil: number | null
} {
  const now = Date.now()
  const record = bruteForceStore.get(key) ?? { attempts: 0, lockedUntil: null }
  record.attempts++

  if (record.attempts >= maxAttempts) {
    record.lockedUntil = now + lockoutMs
  }

  bruteForceStore.set(key, record)
  return {
    locked: record.attempts >= maxAttempts,
    lockedUntil: record.lockedUntil,
  }
}

export function resetBruteForce(key: string): void {
  bruteForceStore.delete(key)
}

export function clearExpiredRateLimits(): void {
  const now = Date.now()
  for (const [key, record] of requestCounts) {
    if (now > record.resetAt) requestCounts.delete(key)
  }
  for (const [key, record] of bruteForceStore) {
    if (record.lockedUntil && now > record.lockedUntil) bruteForceStore.delete(key)
  }
}

setInterval(clearExpiredRateLimits, 60_000)