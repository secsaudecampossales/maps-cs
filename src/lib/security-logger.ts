/**
 * Logger de Segurança Estruturado (Audit & Security Events)
 * Segue diretrizes de rastreabilidade da LGPD e conformidade de saúde.
 */

export type SecurityLogLevel = "INFO" | "WARN" | "ERROR" | "SECURITY_ALERT"

export type SecurityEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_RATE_LIMIT_BLOCKED"
  | "AUTH_LOGOUT"
  | "PATIENT_CREATED"
  | "PATIENT_UPDATED"
  | "PATIENT_DELETED"
  | "PATIENT_VIEWED"
  | "REPORT_GENERATED"
  | "ACCESS_DENIED"
  | "SYSTEM_ERROR"

export interface SecurityEventData {
  event: SecurityEventType
  level: SecurityLogLevel
  actor?: {
    id?: string
    email?: string
    role?: string
    ubsId?: string
    ip?: string
  }
  target?: {
    type: string
    id?: string
    ubsId?: string
  }
  details?: Record<string, unknown>
}

/**
 * Mascara strings confidenciais (Cartão SUS, email, etc.) para não expor PII completo nos logs.
 */
export function maskSensitive(value: string | null | undefined): string {
  if (!value) return "N/A"
  if (value.length <= 4) return "****"
  return `${value.slice(0, 2)}****${value.slice(-3)}`
}

export function logSecurityEvent(data: SecurityEventData): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    ...data,
  }

  // Em produção, logs estruturados em JSON facilitam ingestão em Datadog, CloudWatch, Grafana Loki, etc.
  const jsonString = JSON.stringify(logEntry)

  switch (data.level) {
    case "ERROR":
    case "SECURITY_ALERT":
      console.error(`[SECURITY_LOG] ${jsonString}`)
      break
    case "WARN":
      console.warn(`[SECURITY_LOG] ${jsonString}`)
      break
    case "INFO":
    default:
      console.log(`[SECURITY_LOG] ${jsonString}`)
      break
  }
}
