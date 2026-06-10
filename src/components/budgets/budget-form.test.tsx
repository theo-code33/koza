import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BudgetForm } from "@/components/budgets/budget-form";

describe("BudgetForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a budget via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<BudgetForm onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Vacances d'été"), "Apport immo");
    await userEvent.type(screen.getByPlaceholderText("1200"), "20000");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates a budget via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <BudgetForm
        budget={{
          id: "1",
          name: "Vacances Grèce",
          targetAmount: "1200.00",
          category: "leisure",
          deadline: null,
        }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/budgets/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
