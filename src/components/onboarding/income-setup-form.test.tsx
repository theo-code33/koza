import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { IncomeSetupForm } from "@/components/onboarding/income-setup-form";

describe("IncomeSetupForm", () => {
  beforeEach(() => {
    push.mockClear();
    vi.restoreAllMocks();
  });

  it("adds a second income source row", async () => {
    render(<IncomeSetupForm />);
    expect(screen.getAllByPlaceholderText("Salaire")).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter une source" }));
    expect(screen.getAllByPlaceholderText("Salaire")).toHaveLength(2);
  });

  it("posts the income then navigates to confirm", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 201 }));
    render(<IncomeSetupForm />);
    await userEvent.type(screen.getByPlaceholderText("Salaire"), "Salaire");
    await userEvent.type(screen.getByPlaceholderText("2500"), "2500");
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/confirm"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
