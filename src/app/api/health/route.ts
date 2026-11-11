import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"

export async function GET() {
  const startTime = Date.now()

  try {
    // Valida conectividade real com o banco de dados executando query simples
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: "healthy",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        database: "connected",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        responseTimeMs: Date.now() - startTime,
        database: "disconnected",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    )
  }
}
