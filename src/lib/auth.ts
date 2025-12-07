import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) {
            console.error("Credenciais incompletas")
            return null
          }

          const enfermeiro = await prisma.enfermeiro.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!enfermeiro) {
            console.error("Enfermeiro não encontrado:", credentials.email)
            return null
          }

          const senhaValida = await bcrypt.compare(credentials.senha, enfermeiro.senha)

          if (!senhaValida) {
            console.error("Senha inválida para:", credentials.email)
            return null
          }

          return {
            id: enfermeiro.id,
            email: enfermeiro.email,
            name: enfermeiro.nome,
            isAdmin: enfermeiro.isAdmin,
          }
        } catch (error) {
          console.error("Erro no authorize:", error)
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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
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

