import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { requireAdmin } from "../../../../lib/auth-api"

// GET - Gerar relatórios customizados
export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const ubsId = searchParams.get("ubsId")
    const risco = searchParams.get("risco")
    const etnia = searchParams.get("etnia")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")

    // Construir filtros dinâmicos
    const where: any = {}

    if (ubsId) {
      where.ubsId = ubsId
    }

    if (risco) {
      where.risco = risco
    }

    if (etnia) {
      where.etnia = etnia
    }

    if (dataInicio || dataFim) {
      where.createdAt = {}
      if (dataInicio) {
        where.createdAt.gte = new Date(dataInicio)
      }
      if (dataFim) {
        where.createdAt.lte = new Date(dataFim)
      }
    }

    const gestantes = await prisma.gestante.findMany({
      where,
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

    // Estatísticas do relatório
    const total = gestantes.length
    const porRisco = {
      baixo: gestantes.filter((g: typeof gestantes[number]) => g.risco === "Risco Baixo").length,
      intermediario: gestantes.filter((g: typeof gestantes[number]) => g.risco === "Risco Intermediário").length,
      alto: gestantes.filter((g: typeof gestantes[number]) => g.risco === "Risco Alto").length,
    }

    const porEtnia = gestantes.reduce((acc, g: typeof gestantes[number]) => {
      acc[g.etnia] = (acc[g.etnia] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json(
      {
        gestantes,
        estatisticas: {
          total,
          porRisco,
          porEtnia,
        },
        filtros: {
          ubsId: ubsId || null,
          risco: risco || null,
          etnia: etnia || null,
          dataInicio: dataInicio || null,
          dataFim: dataFim || null,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao gerar relatório"
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
}

