import { prisma } from "./prisma"
import { startOfDay } from "date-fns"

export async function removeGestantesComDppVencida() {
  const hoje = startOfDay(new Date())
  const result = await prisma.gestante.deleteMany({
    where: {
      dpp: {
        lte: hoje,
      },
    },
  })
  return result.count
}

