/**
 * Rate Limiter for Login and Sensitive Actions
 * Prevents brute-force and credential-stuffing attacks with exponential cooldown.
 */

interface RateLimitRecord {
  attempts: number
  lockUntil: number // timestamp in ms
}

const STORAGE_PREFIX = 'aureus_ratelimit_'

const MAX_ATTEMPTS_BEFORE_LOCK = 5
const INITIAL_LOCK_DURATION_MS = 60 * 1000 // 60 seconds
const EXTENDED_LOCK_DURATION_MS = 300 * 1000 // 5 minutes

function getStorageKey(actionKey: string): string {
  return `${STORAGE_PREFIX}${actionKey}`
}

const memoryCache = new Map<string, RateLimitRecord>()

function getRecord(actionKey: string): RateLimitRecord {
  if (memoryCache.has(actionKey)) {
    return memoryCache.get(actionKey)!
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(getStorageKey(actionKey))
      if (raw) {
        const parsed = JSON.parse(raw) as RateLimitRecord
        memoryCache.set(actionKey, parsed)
        return parsed
      }
    }
  } catch {
    // fallback
  }
  return { attempts: 0, lockUntil: 0 }
}

function saveRecord(actionKey: string, record: RateLimitRecord): void {
  memoryCache.set(actionKey, record)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(actionKey), JSON.stringify(record))
    }
  } catch {
    // ignore
  }
}

export function resetRateLimit(actionKey: string): void {
  memoryCache.delete(actionKey)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(getStorageKey(actionKey))
    }
  } catch {
    // ignore
  }
}

export function checkRateLimit(actionKey: string): {
  isLocked: boolean
  remainingSeconds: number
  attempts: number
} {
  const record = getRecord(actionKey)
  const now = Date.now()

  if (record.lockUntil > now) {
    const remainingSeconds = Math.ceil((record.lockUntil - now) / 1000)
    return {
      isLocked: true,
      remainingSeconds,
      attempts: record.attempts,
    }
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    attempts: record.attempts,
  }
}

export function recordFailedAttempt(actionKey: string): {
  isLocked: boolean
  remainingSeconds: number
  attempts: number
} {
  const record = getRecord(actionKey)
  const now = Date.now()
  const newAttempts = record.attempts + 1

  let lockUntil = 0
  if (newAttempts >= 8) {
    lockUntil = now + EXTENDED_LOCK_DURATION_MS
  } else if (newAttempts >= MAX_ATTEMPTS_BEFORE_LOCK) {
    lockUntil = now + INITIAL_LOCK_DURATION_MS
  }

  const updated: RateLimitRecord = {
    attempts: newAttempts,
    lockUntil,
  }

  saveRecord(actionKey, updated)

  if (lockUntil > now) {
    return {
      isLocked: true,
      remainingSeconds: Math.ceil((lockUntil - now) / 1000),
      attempts: newAttempts,
    }
  }

  return {
    isLocked: false,
    remainingSeconds: 0,
    attempts: newAttempts,
  }
}
