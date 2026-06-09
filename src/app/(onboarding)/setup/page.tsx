import Link from "next/link";
import { StepIndicator } from "@/components/onboarding/step-indicator";
import { IncomeSetupForm } from "@/components/onboarding/income-setup-form";

export default function SetupPage() {
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={2} />
      <h1 className="font-serif text-[28px] leading-tight text-text">Tes revenus</h1>
      <p className="mt-3 text-[15px] text-text-secondary">
        Ajoute ta principale source de revenu. Tu pourras en ajouter d&apos;autres ou passer cette
        étape.
      </p>
      <div className="mt-8">
        <IncomeSetupForm />
      </div>
      <div className="mt-6">
        <Link href="/confirm" className="text-[14px] text-text-secondary">
          Passer pour l&apos;instant
        </Link>
      </div>
    </div>
  );
}
