import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { addDays } from "date-fns"
import { getAuthSession, requireAuth } from "../../../lib/auth-api"
import { removeGestantesPosTresMeses } from "../../../lib/gestantes"

// GET - Listar todas as gestantes
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

    await removeGestantesPosTresMeses()
    console.log("Iniciando busca de gestantes...")
    const gestantes = await prisma.gestante.findMany({
      where: whereClause,
      include: {
        ubs: {
          select: {
            id: true,
            nome: true,
            endereco: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    console.log(`Encontradas ${gestantes.length} gestantes`)
    return NextResponse.json(gestantes, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar gestantes:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "N/A")
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar gestantes"
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
    } : { error: String(error) }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

// POST - Criar nova gestante
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
    }

    const body = await request.json()
    const {
      nome,
      cartaoSus,
      ubsId,
      dum,
      etnia,
      gestacoesAnteriores,
      risco,
      descricaoRisco,
      motivoAltoRisco,
      exames,
      vacinas,
    } = body

    // Validações
    if (!cartaoSus) {
      return NextResponse.json(
        { error: "Cartão do SUS é obrigatório" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    const ubsDestino = session.user.isAdmin ? ubsId : session.user.ubsId

    if (!ubsDestino) {
      return NextResponse.json(
        { error: "UBS é obrigatória" },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Calcular DPP (DUM + 280 dias)
    const dpp = addDays(new Date(dum), 280)

    const gestante = await prisma.gestante.create({
      data: {
        nome,
        cartaoSus,
        ubsId: ubsDestino,
        dum: new Date(dum),
        dpp,
        etnia,
        gestacoesAnteriores: parseInt(gestacoesAnteriores) || 0,
        risco,
        descricaoRisco: descricaoRisco || null,
        motivoAltoRisco: motivoAltoRisco || null,
        exameRotina1Trimestre: exames?.rotina1 || false,
        exameRotina2Trimestre: exames?.rotina2 || false,
        exameRotina3Trimestre: exames?.rotina3 || false,
        ultrassom1Trimestre: exames?.ultrassom1 || false,
        ultrassom2Trimestre: exames?.ultrassom2 || false,
        ultrassom3Trimestre: exames?.ultrassom3 || false,
        vacinaHB: vacinas?.hb || false,
        vacinaDT: vacinas?.dt || false,
        vacinaInfluenza: vacinas?.influenza || false,
        vacinaCovid19: vacinas?.covid19 || false,
        vacinaDTPA20Semana: vacinas?.dtpa20Semana || false,
        vacinaVSR28Semana: vacinas?.vsr28Semana || false,
      },
    })

    return NextResponse.json(gestante, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao criar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar gestante"
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

