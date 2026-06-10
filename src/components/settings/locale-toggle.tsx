"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/ui/segmented";
import { setLocaleAction } from "@/app/actions/locale";
import { LOCALES, type Locale } from "@/i18n/config";

export function LocaleToggle() {
  const locale = useLocale();
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Segmented
      options={LOCALES.map((value) => ({ value, label: value.toUpperCase() }))}
      value={locale}
      onChange={(next) =>
        startTransition(async () => {
          await setLocaleAction(next as Locale);
          router.refresh();
        })
      }
    />
  );
}
