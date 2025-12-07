import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "./auth"

export async function getAuthSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth(request: NextRequest) {
  const session = await getAuthSession()
  
  if (!session) {
    return NextResponse.json(
      { error: "Não autorizado" },
      { status: 401 }
    )
  }
  
  return null
}

