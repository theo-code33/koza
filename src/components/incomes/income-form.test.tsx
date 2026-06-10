import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";
import { IncomeForm } from "@/components/incomes/income-form";

describe("IncomeForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates an income via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<IncomeForm month="2026-06" onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Salaire"), "Prime");
    await userEvent.type(screen.getByPlaceholderText("2500"), "500");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates an income via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <IncomeForm
        month="2026-06"
        income={{ id: "1", source: "Salaire", amount: "2500.00" }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
