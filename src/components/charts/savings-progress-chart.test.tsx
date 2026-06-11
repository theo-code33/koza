import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import frMessages from "@/locales/fr.json";
import { SavingsProgressChart } from "@/components/charts/savings-progress-chart";

const points = Array.from({ length: 12 }, (_, i) => ({
  month: `2026-${String(i + 1).padStart(2, "0")}`,
  cumulative: i * 100,
}));

describe("SavingsProgressChart", () => {
  it("renders inside a responsive container without crashing", () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={frMessages}>
        <div style={{ width: 600, height: 300 }}>
          <SavingsProgressChart points={points} />
        </div>
      </NextIntlClientProvider>,
    );
    expect(container.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
