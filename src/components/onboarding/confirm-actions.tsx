"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ConfirmActions() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      });
      if (!res.ok) throw new Error("finish_failed");
      router.push("/dashboard");
    } catch {
      setError(tc("genericError"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-[13px] text-warning">{error}</p> : null}
      <Button full disabled={busy} onClick={finish}>
        {t("finish")}
      </Button>
    </div>
  );
}
