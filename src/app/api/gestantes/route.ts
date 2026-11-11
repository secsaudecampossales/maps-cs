import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { addDays } from "date-fns"
import { getAuthSession, requireAuth } from "../../../lib/auth-api"
import { compactDefined, isAcompanhamentoAtivo, parseMonitoramentoFields } from "../../../lib/monitoramento"
import {
  sanitizeText,
  validateCartaoSus,
  validateDate,
  validateEtnia,
  validateNome,
  validateRisco,
  validateTelefone,
} from "../../../lib/validation"

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
    const gestantesAtivas = gestantes.filter((g) => isAcompanhamentoAtivo(g.dum, g.desfecho))
    return NextResponse.json(gestantesAtivas, {
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

    // Validações rigorosas de entrada
    const nomeValidation = validateNome(nome)
    if (!nomeValidation.valid) {
      return NextResponse.json({ error: nomeValidation.error }, { status: 400 })
    }

    const cartaoValidation = validateCartaoSus(cartaoSus)
    if (!cartaoValidation.valid) {
      return NextResponse.json({ error: cartaoValidation.error }, { status: 400 })
    }

    const dataNascimentoValidation = validateDate(dataNascimento, "Data de nascimento", { allowFuture: false, maxYearsAgo: 80 })
    if (!dataNascimentoValidation.valid) {
      return NextResponse.json({ error: dataNascimentoValidation.error }, { status: 400 })
    }

    const dumValidation = validateDate(dum, "Data da Última Menstruação (DUM)", { allowFuture: false, maxYearsAgo: 2 })
    if (!dumValidation.valid) {
      return NextResponse.json({ error: dumValidation.error }, { status: 400 })
    }

    const etniaValidation = validateEtnia(etnia)
    if (!etniaValidation.valid) {
      return NextResponse.json({ error: etniaValidation.error }, { status: 400 })
    }

    const riscoValidation = validateRisco(risco)
    if (!riscoValidation.valid) {
      return NextResponse.json({ error: riscoValidation.error }, { status: 400 })
    }

    if (riscoValidation.value === "Risco Alto" && !sanitizeText(motivoAltoRisco)) {
      return NextResponse.json({ error: "Motivo do alto risco é obrigatório para gestações de Alto Risco." }, { status: 400 })
    }

    const semanasInicioPreNatalNumero = Number(semanasInicioPreNatal)
    if (!Number.isInteger(semanasInicioPreNatalNumero) || semanasInicioPreNatalNumero < 1 || semanasInicioPreNatalNumero > 45) {
      return NextResponse.json(
        { error: "Semanas de início do pré-natal inválida. Informe um valor entre 1 e 45." },
        { status: 400 }
      )
    }

    const telefoneValidation = validateTelefone(telefone)
    if (!telefoneValidation.valid) {
      return NextResponse.json({ error: telefoneValidation.error }, { status: 400 })
    }

    const gestacoesAnterioresNumero = parseInt(String(gestacoesAnteriores), 10) || 0
    if (gestacoesAnterioresNumero < 0 || gestacoesAnterioresNumero > 50) {
      return NextResponse.json({ error: "Número de gestações anteriores inválido." }, { status: 400 })
    }

    const ubsDestino = session.user.isAdmin ? ubsId : session.user.ubsId
    if (!ubsDestino) {
      return NextResponse.json({ error: "UBS é obrigatória." }, { status: 400 })
    }

    // Calcular DPP (DUM + 280 dias)
    const dpp = addDays(dumValidation.value!, 280)
    const monitoramento = compactDefined(parseMonitoramentoFields(body))

    const gestante = await prisma.gestante.create({
      data: {
        nome: nomeValidation.value!,
        dataNascimento: dataNascimentoValidation.value!,
        cartaoSus: cartaoValidation.value!,
        telefone: telefoneValidation.value ?? null,
        ubsId: ubsDestino,
        dum: dumValidation.value!,
        dpp,
        semanasInicioPreNatal: semanasInicioPreNatalNumero,
        etnia: etniaValidation.value!,
        gestacoesAnteriores: gestacoesAnterioresNumero,
        risco: riscoValidation.value!,
        descricaoRisco: sanitizeText(descricaoRisco) || null,
        motivoAltoRisco: sanitizeText(motivoAltoRisco) || null,
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
        ...monitoramento,
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

