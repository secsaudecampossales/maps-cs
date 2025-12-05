import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Verificar se DATABASE_URL está configurado
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL não está configurado. Usando padrão: file:./dev.db')
} else {
  console.log('DATABASE_URL configurado:', databaseUrl.replace(/file:.*\//, 'file:.../'))
}

// Criar adapter do Prisma para better-sqlite3
// O adapter recebe a URL diretamente
const adapter = new PrismaBetterSqlite3({
  url: databaseUrl.replace('file:', ''),
})

// Prisma Client precisa de um adapter para SQLite no Prisma 7
const prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
} as any)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance

export const prisma = prismaInstance

