import { Prisma } from "@/generated/prisma/client";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";
import { IncomesManager } from "@/components/incomes/incomes-manager";
import { listMonthIncomes } from "@/lib/incomes";
import { computeEnvelopes } from "@/lib/budget";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";

export const dynamic = "force-dynamic";

export default async function IncomesPage() {
  const month = currentMonth();
  const incomes = await listMonthIncomes(month);
  const total = incomes.reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
  const envelopes = computeEnvelopes(total);
  const rows = incomes.map((income) => ({
    id: income.id,
    source: income.source,
    amount: income.amount.toString(),
    month: income.month,
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-[720px] flex-col px-6 py-12">
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes revenus</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0)
          ? `${formatEUR(total)} ce mois-ci, répartis en 50 / 30 / 20.`
          : "Ajoute tes sources de revenu pour voir tes enveloppes."}
      </p>
      <div className="mt-8">
        <EnvelopesSummary envelopes={envelopes} />
      </div>
      <div className="mt-10">
        <IncomesManager incomes={rows} month={month} />
      </div>
    </main>
  );
}
