import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { ExpensesManager } from "@/components/expenses/expenses-manager";

const expenses = [
  {
    id: "1",
    amount: "54.90",
    description: "Courses",
    date: "2026-06-10",
    category: "essential" as const,
    subcategory: "food",
  },
];

describe("ExpensesManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<ExpensesManager expenses={expenses} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter une dépense" }));
    expect(screen.getByText("Nouvelle dépense")).toBeInTheDocument();
  });

  it("deletes an expense then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<ExpensesManager expenses={expenses} />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la dépense" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no expense", () => {
    render(<ExpensesManager expenses={[]} />);
    expect(screen.getByText(/Aucune dépense/)).toBeInTheDocument();
  });
});
