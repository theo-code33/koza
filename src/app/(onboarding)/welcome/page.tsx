import Link from "next/link";
import { StepIndicator } from "@/components/onboarding/step-indicator";

export default function WelcomePage() {
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={1} />
      <h1 className="font-serif text-[40px] leading-tight text-text">Bienvenue sur kōza</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">
        kōza répartit tes revenus selon la règle 50 / 30 / 20 : la moitié pour l&apos;essentiel, 30
        % pour les loisirs, 20 % pour l&apos;épargne. Un budget clair, sans pression.
      </p>
      <div className="mt-10">
        <Link
          href="/setup"
          className="tap inline-flex h-11 items-center justify-center rounded-button bg-accent px-5 text-[15px] font-medium text-white"
        >
          Commencer
        </Link>
      </div>
    </div>
  );
}
