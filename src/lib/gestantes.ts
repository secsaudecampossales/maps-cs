import { prisma } from "./prisma"
import { startOfDay } from "date-fns"

export async function removeGestantesPosTresMeses() {
  const hoje = startOfDay(new Date())
  const tresMesesAtras = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 3,
    hoje.getDate()
  )

  // Buscar gestantes que serão excluídas
  const gestantesParaExcluir = await prisma.gestante.findMany({
    where: {
      dpp: {
        lt: tresMesesAtras,
      },
    },
  })

  // Registrar cada gestante na tabela de exclusões antes de deletar
  if (gestantesParaExcluir.length > 0) {
    await prisma.gestanteExcluida.createMany({
      data: gestantesParaExcluir.map((gestante) => ({
        nome: gestante.nome,
        dataNascimento: gestante.dataNascimento,
        cartaoSus: gestante.cartaoSus,
        telefone: gestante.telefone,
        ubsId: gestante.ubsId,
        dum: gestante.dum,
        dpp: gestante.dpp,
        etnia: gestante.etnia,
        gestacoesAnteriores: gestante.gestacoesAnteriores,
        risco: gestante.risco,
        descricaoRisco: gestante.descricaoRisco,
        motivoAltoRisco: gestante.motivoAltoRisco,
        exameRotina1Trimestre: gestante.exameRotina1Trimestre,
        exameRotina2Trimestre: gestante.exameRotina2Trimestre,
        exameRotina3Trimestre: gestante.exameRotina3Trimestre,
        ultrassom1Trimestre: gestante.ultrassom1Trimestre,
        ultrassom2Trimestre: gestante.ultrassom2Trimestre,
        ultrassom3Trimestre: gestante.ultrassom3Trimestre,
        vacinaHB: gestante.vacinaHB,
        vacinaDT: gestante.vacinaDT,
        vacinaInfluenza: gestante.vacinaInfluenza,
        vacinaCovid19: gestante.vacinaCovid19,
        vacinaDTPA20Semana: gestante.vacinaDTPA20Semana,
        vacinaVSR28Semana: gestante.vacinaVSR28Semana,
        enfermeiroId: null, // Exclusão automática, sem enfermeiro responsável
        motivoExclusao: "automatica",
        createdAtOriginal: gestante.createdAt,
        updatedAtOriginal: gestante.updatedAt,
      })),
    })
  }

  // Deletar as gestantes
  const result = await prisma.gestante.deleteMany({
    where: {
      dpp: {
        lt: tresMesesAtras,
      },
    },
  })
  return result.count
}

