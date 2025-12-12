-- AlterTable
ALTER TABLE "Document" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "baseCurrencyAmount" REAL;
ALTER TABLE "Invoice" ADD COLUMN "exchangeRate" REAL DEFAULT 1.0;
ALTER TABLE "Invoice" ADD COLUMN "paymentMethod" TEXT;

-- CreateTable
CREATE TABLE "BankStatement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT,
    "statementType" TEXT NOT NULL DEFAULT 'BANK',
    "accountInfo" TEXT,
    "last4Digits" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "documentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankStatement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BankStatement_documentId_key" ON "BankStatement"("documentId");
