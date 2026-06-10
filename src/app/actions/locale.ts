"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locale";

const ONE_YEAR = 60 * 60 * 24 * 365;

// Écrit la préférence de langue (DB durable + cookie de rendu). No-op si locale inconnue.
export async function setLocaleAction(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: { locale },
    create: { id: "default", locale },
  });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR });
}
