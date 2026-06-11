import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <p className="font-serif text-[32px] leading-none text-text">kōza</p>
        <h1 className="mt-6 font-serif text-[24px] text-text">{t("loginTitle")}</h1>
        <p className="mt-1 text-[14px] text-text-secondary">{t("loginSubtitle")}</p>
      </div>
      <LoginForm />
    </div>
  );
}
