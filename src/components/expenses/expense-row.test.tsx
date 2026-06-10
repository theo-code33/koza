import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { ExpenseRow } from "@/components/expenses/expense-row";

const expense = {
  id: "1",
  amount: "54.90",
  description: "Courses",
  date: "2026-06-10",
  category: "essential" as const,
  subcategory: "food",
};

describe("ExpenseRow", () => {
  it("shows description, subcategory label, amount and date", () => {
    renderWithIntl(<ExpenseRow expense={expense} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText(/Alimentation/)).toBeInTheDocument();
    expect(screen.getByText(/54,90/)).toBeInTheDocument();
    expect(screen.getByText(/10\/06\/2026/)).toBeInTheDocument();
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    renderWithIntl(<ExpenseRow expense={expense} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier la dépense" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la dépense" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
