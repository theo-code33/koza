-- Multi-tenant : cloisonnement par utilisateur.
-- Destructif : les anciennes lignes n'ont pas de propriétaire (prod de démo quasi vide).
TRUNCATE TABLE "RecurringOccurrence", "Expense", "RecurringExpense", "Budget", "Income", "MonthlyPeriod" RESTART IDENTITY CASCADE;

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- UserSettings : la PK passe de `id` à `userId` (1:1 avec User).
DROP TABLE "UserSettings";
CREATE TABLE "UserSettings" (
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "locale" TEXT NOT NULL DEFAULT 'fr',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("userId")
);

-- AlterTable : userId sur les 6 modèles de données.
ALTER TABLE "Income" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "Expense" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "Budget" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "MonthlyPeriod" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "RecurringExpense" ADD COLUMN "userId" TEXT NOT NULL;
ALTER TABLE "RecurringOccurrence" ADD COLUMN "userId" TEXT NOT NULL;

-- MonthlyPeriod : month n'est plus unique globalement, mais par utilisateur.
DROP INDEX "MonthlyPeriod_month_key";
CREATE UNIQUE INDEX "MonthlyPeriod_userId_month_key" ON "MonthlyPeriod"("userId", "month");

-- CreateIndex (userId)
CREATE INDEX "Income_userId_idx" ON "Income"("userId");
CREATE INDEX "Expense_userId_idx" ON "Expense"("userId");
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");
CREATE INDEX "MonthlyPeriod_userId_idx" ON "MonthlyPeriod"("userId");
CREATE INDEX "RecurringExpense_userId_idx" ON "RecurringExpense"("userId");
CREATE INDEX "RecurringOccurrence_userId_idx" ON "RecurringOccurrence"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MonthlyPeriod" ADD CONSTRAINT "MonthlyPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringExpense" ADD CONSTRAINT "RecurringExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecurringOccurrence" ADD CONSTRAINT "RecurringOccurrence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
