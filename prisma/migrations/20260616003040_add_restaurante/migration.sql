-- CreateTable
CREATE TABLE "Restaurante" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#E85D04',
    "logoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "donoId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Restaurante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurante_slug_key" ON "Restaurante"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Restaurante_donoId_key" ON "Restaurante"("donoId");

-- AddForeignKey
ALTER TABLE "Restaurante" ADD CONSTRAINT "Restaurante_donoId_fkey" FOREIGN KEY ("donoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
