"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locale";
import { getCurrentUserId } from "@/lib/current-user";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Écrit la préférence de langue (DB durable + cookie de rendu). No-op si locale inconnue.
export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const userId = await getCurrentUserId();
  await prisma.userSettings.upsert({
    where: { userId },
    update: { locale },
    create: { userId, locale },
  });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR });
}
