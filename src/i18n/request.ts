import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "@/i18n/locale";

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  const messages = (await import(`../locales/${locale}.json`)).default;
  return { locale, messages };
});
