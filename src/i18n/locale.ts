import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

const SETTINGS_ID = "default";

// Ré-export pour les consommateurs serveur (les Client Components importent depuis @/i18n/config).
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

// Locale active : cookie NEXT_LOCALE (rapide), sinon préférence DB, sinon défaut.
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const settings = await prisma.userSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (isLocale(settings?.locale)) return settings.locale;

  return DEFAULT_LOCALE;
}
