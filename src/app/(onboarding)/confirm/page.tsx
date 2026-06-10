import { getLocale, getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { ConfirmActions } from "@/components/onboarding/confirm-actions";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";
import { prisma } from "@/lib/prisma";
import { computeEnvelopes } from "@/lib/budget";
import { formatEUR } from "@/lib/formatters";
import { currentMonth } from "@/lib/month";

export const dynamic = "force-dynamic";

export default async function ConfirmPage() {
  const locale = (await getLocale()) as "fr" | "en";
  const t = await getTranslations("onboarding");
  const incomes = await prisma.income.findMany({ where: { month: currentMonth() } });
  const total = incomes.reduce((sum, income) => sum.plus(income.amount), new Prisma.Decimal(0));
  const envelopes = computeEnvelopes(total);

  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={3} />
      <h1 className="font-serif text-[28px] leading-tight text-text">{t("confirmTitle")}</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        {total.gt(0)
          ? t("confirmBody", { amount: formatEUR(total, locale) })
          : t("confirmBodyEmpty")}
      </p>
      <div className="mt-8">
        <EnvelopesSummary envelopes={envelopes} />
      </div>
      <div className="mt-10">
        <ConfirmActions />
      </div>
    </div>
  );
}
