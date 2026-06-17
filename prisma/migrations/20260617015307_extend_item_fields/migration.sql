/*
  Warnings:

  - Added the required column `nome` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `preco` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "destaque" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "disponivel" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fotoUrl" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "ordem" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preco" DECIMAL(10,2) NOT NULL;
