/**
 * Módulo de Rate Limiting em memória para proteção contra força bruta e DoS.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
  blockedUntil?: number
}

// Mapas em memória para rastreamento de requisições
const loginAttemptsMap = new Map<string, RateLimitRecord>()
const apiRequestsMap = new Map<string, RateLimitRecord>()

// Limpeza periódica de registros expirados para evitar vazamento de memória (a cada 5 minutos)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of loginAttemptsMap.entries()) {
      if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
        loginAttemptsMap.delete(key)
      }
    }
    for (const [key, record] of apiRequestsMap.entries()) {
      if (now > record.resetTime) {
        apiRequestsMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Configuração de proteção contra força bruta no Login:
 * Máximo de 5 tentativas inválidas a cada 15 minutos.
 * Após 5 falhas, bloqueia por 15 minutos adicionais.
 */
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutos
const LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutos de bloqueio

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean
  remainingAttempts: number
  retryAfterSeconds?: number
} {
  const now = Date.now()
  const record = loginAttemptsMap.get(identifier)

  if (!record) {
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS }
  }

  // Verifica se está no período de bloqueio ativo
  if (record.blockedUntil && now < record.blockedUntil) {
    const retryAfterSeconds = Math.ceil((record.blockedUntil - now) / 1000)
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds,
    }
  }

  // Se a janela de tempo expirou, reseta o histórico
  if (now > record.resetTime) {
    loginAttemptsMap.delete(identifier)
    return { allowed: true, remainingAttempts: LOGIN_MAX_ATTEMPTS }
  }

  const remaining = Math.max(0, LOGIN_MAX_ATTEMPTS - record.count)
  return {
    allowed: record.count < LOGIN_MAX_ATTEMPTS,
    remainingAttempts: remaining,
  }
}

export function recordFailedLogin(identifier: string): {
  blocked: boolean
  retryAfterSeconds?: number
} {
  const now = Date.now()
  let record = loginAttemptsMap.get(identifier)

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + LOGIN_WINDOW_MS,
    }
  } else {
    record.count += 1
  }

  // Se atingiu o limite de tentativas, bloqueia
  if (record.count >= LOGIN_MAX_ATTEMPTS) {
    record.blockedUntil = now + LOGIN_BLOCK_DURATION_MS
    loginAttemptsMap.set(identifier, record)
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil(LOGIN_BLOCK_DURATION_MS / 1000),
    }
  }

  loginAttemptsMap.set(identifier, record)
  return { blocked: false }
}

export function recordSuccessfulLogin(identifier: string): void {
  loginAttemptsMap.delete(identifier)
}

/**
 * Rate Limit para chamadas de API gerais
 * Limite: 120 requisições por minuto por IP/Token
 */
const API_MAX_REQUESTS = 120
const API_WINDOW_MS = 60 * 1000 // 1 minuto

export function checkApiRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
} {
  const now = Date.now()
  let record = apiRequestsMap.get(identifier)

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + API_WINDOW_MS,
    }
    apiRequestsMap.set(identifier, record)
    return { allowed: true, remaining: API_MAX_REQUESTS - 1 }
  }

  record.count += 1
  apiRequestsMap.set(identifier, record)

  if (record.count > API_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    }
  }

  return {
    allowed: true,
    remaining: API_MAX_REQUESTS - record.count,
  }
}
