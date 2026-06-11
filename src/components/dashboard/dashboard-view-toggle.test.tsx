import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { DashboardViewToggle } from "@/components/dashboard/dashboard-view-toggle";

describe("DashboardViewToggle", () => {
  it("renders both view labels and marks the active one", () => {
    renderWithIntl(<DashboardViewToggle view="year" />);
    const month = screen.getByRole("link", { name: "Mois" });
    const year = screen.getByRole("link", { name: "Année" });
    expect(month).toHaveAttribute("href", "/dashboard");
    expect(year).toHaveAttribute("href", "/dashboard?view=year");
    expect(year.getAttribute("aria-current")).toBe("page");
  });
});
