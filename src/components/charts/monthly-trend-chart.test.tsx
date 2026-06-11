import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/locales/fr.json";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";

const points = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, "0")}`,
  essential: i * 10,
  leisure: i * 5,
  savings: i * 2,
}));

describe("MonthlyTrendChart", () => {
  it("renders inside a responsive container without crashing", () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={frMessages}>
        <div style={{ width: 600, height: 300 }}>
          <MonthlyTrendChart points={points} />
        </div>
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
