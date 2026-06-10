import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseQuickForm } from "@/components/expenses/expense-quick-form";

describe("ExpenseQuickForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates an expense via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<ExpenseQuickForm onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByLabelText("Montant"), "20");
    await userEvent.type(screen.getByPlaceholderText("Courses, restaurant…"), "Pain");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resets the subcategory when the category changes", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(null, { status: 201 }));
    render(<ExpenseQuickForm onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole("button", { name: "Logement" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Loisirs" }));
    expect(screen.getByRole("button", { name: "Restaurants" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("updates an expense via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <ExpenseQuickForm
        expense={{
          id: "1",
          amount: "54.90",
          description: "Courses",
          date: "2026-06-10",
          category: "essential",
          subcategory: "food",
          budgetId: null,
        }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("only lists budgets of the selected category and submits budgetId", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    const budgets = [
      { id: "b1", name: "Vacances", category: "leisure" as const },
      { id: "b2", name: "Fonds", category: "savings" as const },
    ];
    render(<ExpenseQuickForm budgets={budgets} onSuccess={onSuccess} onCancel={() => {}} />);
    const select = screen.getByLabelText("Budget (optionnel)");
    // catégorie par défaut = Essentiels → aucun budget proposé
    expect(within(select).queryByRole("option", { name: "Vacances" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Loisirs" }));
    expect(within(select).getByRole("option", { name: "Vacances" })).toBeInTheDocument();
    await userEvent.selectOptions(select, "b1");
    await userEvent.type(screen.getByLabelText("Montant"), "50");
    await userEvent.type(screen.getByPlaceholderText("Courses, restaurant…"), "Hotel");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/expenses",
      expect.objectContaining({ body: expect.stringContaining('"budgetId":"b1"') }),
    );
  });
});
