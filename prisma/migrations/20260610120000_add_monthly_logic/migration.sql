-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('FIXED', 'VARIABLE');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "OccurrenceStatus" AS ENUM ('APPLIED', 'PENDING', 'CONFIRMED', 'DROPPED');

-- AlterTable: Expense.month (backfill depuis date), Expense.recurringId
ALTER TABLE "Expense" ADD COLUMN     "month" TEXT;
UPDATE "Expense" SET "month" = to_char("date", 'YYYY-MM') WHERE "month" IS NULL;
ALTER TABLE "Expense" ALTER COLUMN "month" SET NOT NULL;
ALTER TABLE "Expense" ADD COLUMN     "recurringId" TEXT;

-- AlterTable: Income.date (backfill = 1er jour du month)
ALTER TABLE "Income" ADD COLUMN     "date" TIMESTAMP(3);
UPDATE "Income" SET "date" = ("month" || '-01')::timestamp WHERE "date" IS NULL;
ALTER TABLE "Income" ALTER COLUMN "date" SET NOT NULL;

-- DropTable
DROP TABLE "MonthlyBalance";

-- CreateTable
CREATE TABLE "MonthlyPeriod" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "carryIn" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "carryOut" DECIMAL(12,2),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RecurringType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "frequency" "Frequency" NOT NULL,
    "anchorMonth" TEXT NOT NULL,
    "endMonth" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringOccurrence" (
    "id" TEXT NOT NULL,
    "recurringId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "OccurrenceStatus" NOT NULL,
    "expenseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPeriod_month_key" ON "MonthlyPeriod"("month");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringOccurrence_recurringId_month_key" ON "RecurringOccurrence"("recurringId", "month");

-- CreateIndex
CREATE INDEX "Expense_month_idx" ON "Expense"("month");

-- CreateIndex
CREATE INDEX "Income_month_idx" ON "Income"("month");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_recurringId_fkey" FOREIGN KEY ("recurringId") REFERENCES "RecurringExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
