import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { addDays } from "date-fns"
import { requireAuth } from "../../../../lib/auth-api"

// GET - Buscar gestante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const gestante = await prisma.gestante.findUnique({
      where: { id },
    })

    if (!gestante) {
      return NextResponse.json(
        { error: "Gestante não encontrada" },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return NextResponse.json(gestante, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao buscar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao buscar gestante"
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

// PUT - Atualizar gestante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const { nome, cartaoSus, ubsId, dum, etnia, gestacoesAnteriores, risco, descricaoRisco, motivoAltoRisco, exames } = body

    // Calcular DPP se DUM foi alterada
    let dpp = undefined
    if (dum) {
      dpp = addDays(new Date(dum), 280)
    }

    const gestante = await prisma.gestante.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(cartaoSus && { cartaoSus }),
        ...(ubsId && { ubsId }),
        ...(dum && { dum: new Date(dum) }),
        ...(dpp && { dpp }),
        ...(etnia && { etnia }),
        ...(gestacoesAnteriores !== undefined && { gestacoesAnteriores: parseInt(gestacoesAnteriores) }),
        ...(risco && { risco }),
        ...(descricaoRisco !== undefined && { descricaoRisco }),
        ...(motivoAltoRisco !== undefined && { motivoAltoRisco }),
        ...(exames && {
          exameRotina1Trimestre: exames.rotina1 ?? undefined,
          exameRotina2Trimestre: exames.rotina2 ?? undefined,
          exameRotina3Trimestre: exames.rotina3 ?? undefined,
          ultrassom1Trimestre: exames.ultrassom1 ?? undefined,
          ultrassom2Trimestre: exames.ultrassom2 ?? undefined,
          ultrassom3Trimestre: exames.ultrassom3 ?? undefined,
        }),
      },
    })

    return NextResponse.json(gestante, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar gestante"
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

// DELETE - Deletar gestante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError

  try {
    const { id } = await params
    await prisma.gestante.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: "Gestante deletada com sucesso" },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error("Erro ao deletar gestante:", error)
    const errorMessage = error instanceof Error ? error.message : "Erro ao deletar gestante"
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

