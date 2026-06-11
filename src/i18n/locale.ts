import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";
import { getCurrentUserId } from "@/lib/current-user";

// Ré-export pour les consommateurs serveur (les Client Components importent depuis @/i18n/config).
export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/config";

// Locale active : cookie NEXT_LOCALE (rapide), sinon préférence de l'utilisateur courant, sinon défaut.
export async function resolveLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  try {
    const userId = await getCurrentUserId();
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    if (isLocale(settings?.locale)) return settings.locale;
  } catch {
    // Aucun utilisateur courant (pré-auth) → défaut.
  }

  return DEFAULT_LOCALE;
}
