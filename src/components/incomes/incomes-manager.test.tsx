import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { IncomesManager } from "@/components/incomes/incomes-manager";

const incomes = [{ id: "1", source: "Salaire", amount: "2500.00", month: "2026-06" }];

describe("IncomesManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<IncomesManager incomes={incomes} month="2026-06" />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter un revenu" }));
    expect(screen.getByText("Nouveau revenu")).toBeInTheDocument();
  });

  it("deletes an income then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<IncomesManager incomes={incomes} month="2026-06" />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer le revenu" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/incomes/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no income", () => {
    render(<IncomesManager incomes={[]} month="2026-06" />);
    expect(screen.getByText(/Aucun revenu/)).toBeInTheDocument();
  });
});
