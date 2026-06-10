import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { BudgetsManager } from "@/components/budgets/budgets-manager";

const budgets = [
  {
    id: "1",
    name: "Vacances Grèce",
    targetAmount: "1200.00",
    spent: "350.00",
    category: "leisure" as const,
    deadline: null,
  },
];

describe("BudgetsManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<BudgetsManager budgets={budgets} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un budget" }));
    expect(screen.getByText("Nouveau budget")).toBeInTheDocument();
  });

  it("deletes a budget then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<BudgetsManager budgets={budgets} />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le budget" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no budget", () => {
    render(<BudgetsManager budgets={[]} />);
    expect(screen.getByText(/Aucun budget/)).toBeInTheDocument();
  });
});
