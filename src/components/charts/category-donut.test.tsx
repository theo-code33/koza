import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
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
});
