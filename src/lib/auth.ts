import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { checkLoginRateLimit, recordFailedLogin, recordSuccessfulLogin } from "./rate-limit"
import { logSecurityEvent } from "./security-logger"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials, req) {
        const clientIp = (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || "127.0.0.1"

        try {
          if (!credentials?.email || !credentials?.senha) {
            logSecurityEvent({
              event: "AUTH_LOGIN_FAILED",
              level: "WARN",
              details: { reason: "Credenciais incompletas", ip: clientIp },
            })
            return null
          }

          const emailNormalizado = credentials.email.trim().toLowerCase()
          const senhaInformada = credentials.senha.trim()

          // Proteção contra força bruta (Rate Limit por email e por IP)
          const emailRate = checkLoginRateLimit(emailNormalizado)
          const ipRate = checkLoginRateLimit(clientIp)

          if (!emailRate.allowed || !ipRate.allowed) {
            const retryAfter = emailRate.retryAfterSeconds || ipRate.retryAfterSeconds || 900
            const minutos = Math.ceil(retryAfter / 60)
            logSecurityEvent({
              event: "AUTH_RATE_LIMIT_BLOCKED",
              level: "SECURITY_ALERT",
              actor: { email: emailNormalizado, ip: clientIp },
              details: { retryAfterSeconds: retryAfter },
            })
            throw new Error(`Muitas tentativas inválidas. Conta bloqueada temporariamente. Tente novamente em ${minutos} minutos.`)
          }

          const enfermeiro = await prisma.enfermeiro.findFirst({
            where: {
              email: {
                equals: emailNormalizado,
                mode: "insensitive",
              },
            },
            select: {
              id: true,
              email: true,
              nome: true,
              senha: true,
              isAdmin: true,
              ubsId: true,
            },
          })

          if (!enfermeiro) {
            recordFailedLogin(emailNormalizado)
            recordFailedLogin(clientIp)
            logSecurityEvent({
              event: "AUTH_LOGIN_FAILED",
              level: "WARN",
              actor: { email: emailNormalizado, ip: clientIp },
              details: { reason: "Usuário não encontrado" },
            })
            return null
          }

          const senhaValida = await bcrypt.compare(senhaInformada, enfermeiro.senha)

          if (!senhaValida) {
            const failEmail = recordFailedLogin(emailNormalizado)
            const failIp = recordFailedLogin(clientIp)
            logSecurityEvent({
              event: "AUTH_LOGIN_FAILED",
              level: "WARN",
              actor: { id: enfermeiro.id, email: emailNormalizado, ip: clientIp },
              details: { reason: "Senha incorreta" },
            })

            if (failEmail.blocked || failIp.blocked) {
              throw new Error("Limite de tentativas excedido. Acesso bloqueado por 15 minutos.")
            }
            return null
          }

          // Login com sucesso: limpa o contador de tentativas falhas
          recordSuccessfulLogin(emailNormalizado)
          recordSuccessfulLogin(clientIp)

          logSecurityEvent({
            event: "AUTH_LOGIN_SUCCESS",
            level: "INFO",
            actor: {
              id: enfermeiro.id,
              email: enfermeiro.email,
              role: enfermeiro.isAdmin ? "admin" : "enfermeiro",
              ubsId: enfermeiro.ubsId ?? undefined,
              ip: clientIp,
            },
          })

          const ubsId = enfermeiro.ubsId ?? undefined

          return {
            id: enfermeiro.id,
            email: enfermeiro.email,
            name: enfermeiro.nome,
            isAdmin: enfermeiro.isAdmin,
            ubsId,
          }
        } catch (error) {
          if (error instanceof Error && (error.message.includes("bloqueada") || error.message.includes("bloqueado"))) {
            throw error
          }
          logSecurityEvent({
            event: "SYSTEM_ERROR",
            level: "ERROR",
            details: { error: error instanceof Error ? error.message : String(error) },
          })
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60, // 4 horas de validade máxima para conformidade médica/LGPD
    updateAge: 60 * 60, // Atualiza a cada 1 hora se usuário ativo
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
        token.ubsId = user.ubsId ?? undefined
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.ubsId = token.ubsId as string | undefined
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}

