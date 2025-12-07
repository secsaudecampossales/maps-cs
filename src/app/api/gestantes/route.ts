import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { addDays } from "date-fns"
import { requireAuth } from "../../../lib/auth-api"

// GET - Listar todas as gestantes
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    console.log("Iniciando busca de gestantes...")
    const gestantes = await prisma.gestante.findMany({
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
    const body = await request.json()
    const { nome, cartaoSus, dum, etnia, gestacoesAnteriores, risco, descricaoRisco, motivoAltoRisco, exames } = body

    // Validação do cartão do SUS
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

    // Calcular DPP (DUM + 280 dias)
    const dpp = addDays(new Date(dum), 280)

    const gestante = await prisma.gestante.create({
      data: {
        nome,
        cartaoSus,
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

