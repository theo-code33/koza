import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncomeRow } from "@/components/incomes/income-row";

const income = { id: "1", source: "Salaire", amount: "2500.00", month: "2026-06" };

describe("IncomeRow", () => {
  it("shows the source and formatted amount", () => {
    render(<IncomeRow income={income} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText("Salaire")).toBeInTheDocument();
    expect(screen.getByText(/2.?500,00/)).toBeInTheDocument();
  });

  it("fires edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<IncomeRow income={income} onEdit={onEdit} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Modifier le revenu" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le revenu" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
