import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"
import { getAuthSession, requireAuth } from "../../../../lib/auth-api"
import { removeGestantesComDppVencida } from "../../../../lib/gestantes"

// GET - Estatísticas das gestantes
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    if (!session.user.isAdmin && !session.user.ubsId) {
      return NextResponse.json(
        { error: "Profissional sem UBS associada" },
        { status: 400 }
      )
    }

    const whereClause = session.user.isAdmin
      ? undefined
      : { ubsId: session.user.ubsId! }

    await removeGestantesComDppVencida()
    const totalGestantes = await prisma.gestante.count({
      where: whereClause,
    })
    
    const gestantesAltoRisco = await prisma.gestante.count({
      where: {
        ...whereClause,
        risco: "Risco Alto",
      },
    })

    const gestantesRiscoIntermediario = await prisma.gestante.count({
      where: {
        ...whereClause,
        risco: "Risco Intermediário",
      },
    })

    // Contar partos deste mês (DPP no mês atual)
    const inicioMes = startOfMonth(new Date())
    const fimMes = endOfMonth(new Date())
    
    const partosEsteMes = await prisma.gestante.count({
      where: {
        ...whereClause,
        dpp: {
          gte: inicioMes,
          lte: fimMes,
        },
      },
    })

    return NextResponse.json({
      totalGestantes,
      gestantesAltoRisco,
      gestantesRiscoIntermediario,
      partosEsteMes,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar estatísticas"
    return NextResponse.json(
      { error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

