import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const LOCALES = ["fr", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";
export const LOCALE_COOKIE = "NEXT_LOCALE";
const SETTINGS_ID = "default";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

// Locale active : cookie NEXT_LOCALE (rapide), sinon préférence DB, sinon défaut.
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const settings = await prisma.userSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (isLocale(settings?.locale)) return settings.locale;

  return DEFAULT_LOCALE;
}
