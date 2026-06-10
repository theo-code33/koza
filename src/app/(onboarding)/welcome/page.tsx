import Link from "next/link";
import { useTranslations } from "next-intl";
import { StepIndicator } from "@/components/onboarding/step-indicator";

export default function WelcomePage() {
  const t = useTranslations("onboarding");
  return (
    <div className="screen-enter flex flex-1 flex-col">
      <StepIndicator step={1} />
      <h1 className="font-serif text-[40px] leading-tight text-text">{t("welcomeTitle")}</h1>
      <p className="mt-4 text-[16px] leading-relaxed text-text-secondary">{t("welcomeBody")}</p>
      <div className="mt-10">
        <Link
          href="/setup"
          className="tap inline-flex h-11 items-center justify-center rounded-button bg-accent px-5 text-[15px] font-medium text-white"
        >
          {t("start")}
        </Link>
      </div>
    </div>
  );
}
