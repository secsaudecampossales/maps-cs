-- CreateTable
CREATE TABLE "Gestante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "dum" DATETIME NOT NULL,
    "dpp" DATETIME NOT NULL,
    "etnia" TEXT NOT NULL,
    "gestacoesAnteriores" INTEGER NOT NULL DEFAULT 0,
    "risco" TEXT NOT NULL,
    "descricaoRisco" TEXT,
    "motivoAltoRisco" TEXT,
    "exameRotina1Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "exameRotina2Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "exameRotina3Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom1Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom2Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "ultrassom3Trimestre" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
