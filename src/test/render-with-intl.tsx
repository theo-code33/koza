import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/locales/fr.json";

// Rend un composant client en fournissant le catalogue FR réel,
// afin que les assertions sur les textes français restent valides.
export function renderWithIntl(ui: ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={frMessages}>
      {ui}
    </NextIntlClientProvider>,
  );
}
