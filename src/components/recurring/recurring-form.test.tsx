import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";
import { RecurringForm } from "@/components/recurring/recurring-form";

describe("RecurringForm", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates a model via POST in add mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<RecurringForm onSuccess={onSuccess} onCancel={() => {}} />);
    await userEvent.type(screen.getByPlaceholderText("Loyer, assurance…"), "Loyer");
    await userEvent.type(screen.getByPlaceholderText("800"), "850");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates a model via PUT in edit mode", async () => {
    const onSuccess = vi.fn();
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(
      <RecurringForm
        model={{
          id: "r1",
          label: "Loyer",
          type: "FIXED",
          amount: "850.00",
          category: "essential",
          subcategory: "housing",
          frequency: "MONTHLY",
          anchorMonth: "2026-01",
          endMonth: null,
          active: true,
        }}
        onSuccess={onSuccess}
        onCancel={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring/r1",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});
