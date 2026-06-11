import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import { CategoryDonut } from "@/components/charts/category-donut";

describe("CategoryDonut", () => {
  it("renders the balance in the center", () => {
    render(
      <CategoryDonut
        slices={[
          { category: "essential", amount: 500 },
          { category: "leisure", amount: 100 },
          { category: "savings", amount: 0 },
        ]}
        balance={1400}
      />,
    );
    expect(screen.getByText(/restant/)).toBeInTheDocument();
    expect(screen.getByText(/1\s?400,00/)).toBeInTheDocument();
  });

  it("uses custom center value and label when provided", () => {
    render(
      <CategoryDonut
        slices={[{ category: "essential", amount: 100 }]}
        balance={0}
        centerValue={1100}
        centerLabel="dépensé"
      />,
    );
    expect(screen.getByText(/1\s?100,00/)).toBeInTheDocument();
    expect(screen.getByText("dépensé")).toBeInTheDocument();
  });
});
