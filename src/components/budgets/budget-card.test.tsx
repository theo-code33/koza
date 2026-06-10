import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetCard } from "@/components/budgets/budget-card";

const budget = {
  id: "1",
  name: "Vacances Grèce",
  targetAmount: "1200.00",
  spent: "350.00",
  category: "leisure" as const,
  deadline: "2026-08-01",
};

describe("BudgetCard", () => {
  it("shows the name, amounts, progress and deadline", () => {
    render(<BudgetCard budget={budget} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Vacances Grèce")).toBeInTheDocument();
    expect(screen.getByText(/350,00/)).toBeInTheDocument();
    expect(screen.getByText(/Échéance/)).toBeInTheDocument();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "350");
    expect(bar).toHaveAttribute("aria-valuemax", "1200");
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<BudgetCard budget={budget} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier le budget" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le budget" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
