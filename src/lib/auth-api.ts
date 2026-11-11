import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "./auth"
import { checkApiRateLimit } from "./rate-limit"
import { logSecurityEvent } from "./security-logger"

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth(request?: NextRequest) {
  const session = await getAuthSession()
  if (!session) {
    logSecurityEvent({
      event: "ACCESS_DENIED",
      level: "WARN",
      details: {
        path: request?.nextUrl?.pathname ?? "API",
        reason: "Usuário não autenticado",
      },
    })
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    )
  }

  // Rate Limiting para APIs autenticadas
  if (request) {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1"
    const identifier = session.user?.id || clientIp
    const rate = checkApiRateLimit(identifier)

    if (!rate.allowed) {
      logSecurityEvent({
        event: "AUTH_RATE_LIMIT_BLOCKED",
        level: "WARN",
        actor: {
          id: session.user?.id,
          email: session.user?.email,
          ip: clientIp,
        },
        details: {
          path: request.nextUrl.pathname,
          retryAfterSeconds: rate.retryAfterSeconds,
        },
      })
      return NextResponse.json(
        { error: "Limite de requisições excedido. Aguarde alguns instantes." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds || 60),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }
  }

  return null
}

export async function requireAdmin(request?: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const session = await getAuthSession()
  if (!session?.user?.isAdmin) {
    logSecurityEvent({
      event: "ACCESS_DENIED",
      level: "SECURITY_ALERT",
      actor: {
        id: session?.user?.id,
        email: session?.user?.email,
        role: "enfermeiro",
      },
      details: {
        path: request?.nextUrl?.pathname ?? "API_ADMIN",
        reason: "Tentativa de acesso a recurso administrativo sem privilégios de administrador",
      },
    })
    return NextResponse.json(
      { error: "Acesso negado. Apenas administradores podem acessar esta área." },
      { status: 403 }
    )
  }
  return null
}
