"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Toggle } from "@/components/ui/toggle";

const emptySubscribe = () => () => {};

// Vrai uniquement côté client (évite le mismatch d'hydratation de next-themes).
function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const t = useTranslations("settings");
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Toggle
      on={isDark}
      onChange={(next) => setTheme(next ? "dark" : "light")}
      label={t("darkThemeToggle")}
    />
  );
}
