import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { addDays } from "date-fns"
import { getAuthSession, requireAuth } from "../../../../lib/auth-api"
import { compactDefined, parseMonitoramentoFields } from "../../../../lib/monitoramento"
import { snapshotExclusao } from "../../../../lib/gestantes"
import {
  sanitizeText,
  validateCartaoSus,
  validateDate,
  validateEtnia,
  validateNome,
  validateRisco,
  validateTelefone,
} from "../../../../lib/validation"

// GET - Buscar gestante por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
    const gestante = await prisma.gestante.findUnique({
      where: { id },
      include: {
        ubs: {
          select: { id: true, nome: true, endereco: true },
        },
      },
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

    if (!session.user.isAdmin && gestante.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
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
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const {
      nome,
      dataNascimento,
      cartaoSus,
      telefone,
      ubsId,
      dum,
      semanasInicioPreNatal,
      etnia,
      gestacoesAnteriores,
      risco,
      descricaoRisco,
      motivoAltoRisco,
      exames,
      vacinas,
    } = body

    const gestanteAtual = await prisma.gestante.findUnique({ where: { id } })
    if (!gestanteAtual) {
      return NextResponse.json({ error: "Gestante não encontrada" }, { status: 404 })
    }

    if (!session.user.isAdmin && gestanteAtual.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
      )
    }

    const updatedData: Record<string, unknown> = {}

    if (nome !== undefined) {
      const v = validateNome(nome)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.nome = v.value
    }

    if (cartaoSus !== undefined) {
      const v = validateCartaoSus(cartaoSus)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.cartaoSus = v.value
    }

    if (dataNascimento !== undefined) {
      const v = validateDate(dataNascimento, "Data de nascimento", { allowFuture: false, maxYearsAgo: 80 })
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.dataNascimento = v.value
    }

    if (dum !== undefined) {
      const v = validateDate(dum, "Data da Última Menstruação (DUM)", { allowFuture: false, maxYearsAgo: 2 })
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.dum = v.value
      updatedData.dpp = addDays(v.value!, 280)
    }

    if (etnia !== undefined) {
      const v = validateEtnia(etnia)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.etnia = v.value
    }

    if (risco !== undefined) {
      const v = validateRisco(risco)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.risco = v.value
    }

    if (telefone !== undefined) {
      const v = validateTelefone(telefone)
      if (!v.valid) return NextResponse.json({ error: v.error }, { status: 400 })
      updatedData.telefone = v.value
    }

    if (semanasInicioPreNatal !== undefined) {
      const parsedSemanasInicioPreNatal = Number(semanasInicioPreNatal)
      if (!Number.isInteger(parsedSemanasInicioPreNatal) || parsedSemanasInicioPreNatal < 1 || parsedSemanasInicioPreNatal > 45) {
        return NextResponse.json(
          { error: "Semanas de início do pré-natal inválida. Informe um valor entre 1 e 45." },
          { status: 400 }
        )
      }
      updatedData.semanasInicioPreNatal = parsedSemanasInicioPreNatal
    }

    if (gestacoesAnteriores !== undefined) {
      const num = parseInt(String(gestacoesAnteriores), 10)
      if (Number.isNaN(num) || num < 0 || num > 50) {
        return NextResponse.json({ error: "Número de gestações anteriores inválido." }, { status: 400 })
      }
      updatedData.gestacoesAnteriores = num
    }

    if (session.user.isAdmin && ubsId) {
      updatedData.ubsId = ubsId
    }

    if (descricaoRisco !== undefined) {
      updatedData.descricaoRisco = sanitizeText(descricaoRisco) || null
    }

    if (motivoAltoRisco !== undefined) {
      updatedData.motivoAltoRisco = sanitizeText(motivoAltoRisco) || null
    }

    const gestante = await prisma.gestante.update({
      where: { id },
      data: {
        ...updatedData,
        ...(exames && {
          exameRotina1Trimestre: exames.rotina1 ?? undefined,
          exameRotina2Trimestre: exames.rotina2 ?? undefined,
          exameRotina3Trimestre: exames.rotina3 ?? undefined,
          ultrassom1Trimestre: exames.ultrassom1 ?? undefined,
          ultrassom2Trimestre: exames.ultrassom2 ?? undefined,
          ultrassom3Trimestre: exames.ultrassom3 ?? undefined,
        }),
        ...(vacinas && {
          vacinaHB: vacinas.hb ?? undefined,
          vacinaDT: vacinas.dt ?? undefined,
          vacinaInfluenza: vacinas.influenza ?? undefined,
          vacinaCovid19: vacinas.covid19 ?? undefined,
          vacinaDTPA20Semana: vacinas.dtpa20Semana ?? undefined,
          vacinaVSR28Semana: vacinas.vsr28Semana ?? undefined,
        }),
        ...compactDefined(parseMonitoramentoFields(body)),
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
  const session = await getAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 })
  }

  try {
    const { id } = await params
    const gestanteAtual = await prisma.gestante.findUnique({ where: { id } })
    if (!gestanteAtual) {
      return NextResponse.json({ error: "Gestante não encontrada" }, { status: 404 })
    }

    if (!session.user.isAdmin && gestanteAtual.ubsId !== session.user.ubsId) {
      return NextResponse.json(
        { error: "Acesso negado à gestante" },
        { status: 403 }
      )
    }

    // Registrar auditoria e excluir de forma atômica via transação
    await prisma.$transaction(async (tx) => {
      await tx.gestanteExcluida.create({
        data: {
          ...snapshotExclusao(gestanteAtual),
          enfermeiroId: session.user.id,
          motivoExclusao: "manual",
        },
      })

      await tx.gestante.delete({
        where: { id },
      })
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

