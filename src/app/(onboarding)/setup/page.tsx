import Link from "next/link";
import { useTranslations } from "next-intl";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { IncomeSetupForm } from "@/components/onboarding/income-setup-form";

export default function SetupPage() {
  const t = useTranslations("onboarding");
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={2} />
      <h1 className="font-serif text-[28px] leading-tight text-text">{t("setupTitle")}</h1>
      <p className="mt-3 text-[15px] text-text-secondary">{t("setupBody")}</p>
      <div className="mt-8">
        <IncomeSetupForm />
      </div>
      <div className="mt-6">
        <Link href="/confirm" className="text-[14px] text-text-secondary">
          {t("skip")}
        </Link>
      </div>
    </div>
  );
}
