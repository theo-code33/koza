import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

import { AppNav } from "@/components/nav/app-nav";

describe("AppNav", () => {
  it("renders the four destinations (sidebar + bottom nav)", () => {
    render(<AppNav />);
    expect(screen.getAllByRole("link", { name: "Tableau de bord" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Dépenses" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Budgets" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Réglages" })).toHaveLength(2);
    expect(screen.queryByRole("link", { name: "Revenus" })).not.toBeInTheDocument();
  });

  it("marks the active destination", () => {
    render(<AppNav />);
    screen
      .getAllByRole("link", { name: "Tableau de bord" })
      .forEach((link) => expect(link).toHaveAttribute("aria-current", "page"));
    screen
      .getAllByRole("link", { name: "Dépenses" })
      .forEach((link) => expect(link).not.toHaveAttribute("aria-current"));
  });
});
