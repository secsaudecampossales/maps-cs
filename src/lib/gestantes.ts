import { prisma } from "./prisma"
import { startOfDay } from "date-fns"

export async function removeGestantesPosTresMeses() {
  const hoje = startOfDay(new Date())
  const tresMesesAtras = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 3,
    hoje.getDate()
  )

  const result = await prisma.gestante.deleteMany({
    where: {
      dpp: {
        lt: tresMesesAtras,
      },
    },
  })
  return result.count
}

