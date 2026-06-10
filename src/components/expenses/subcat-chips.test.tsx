import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { SubcatChips } from "@/components/expenses/subcat-chips";

describe("SubcatChips", () => {
  it("renders the subcategories of the active category and marks the selected one", () => {
    renderWithIntl(<SubcatChips category="essential" value="housing" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Logement" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Alimentation" })).toBeInTheDocument();
  });

  it("calls onChange with the chosen subcategory key", async () => {
    const onChange = vi.fn();
    renderWithIntl(<SubcatChips category="essential" value="housing" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Alimentation" }));
    expect(onChange).toHaveBeenCalledWith("food");
  });
});
