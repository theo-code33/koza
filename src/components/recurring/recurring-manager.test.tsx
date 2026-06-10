import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { RecurringManager } from "@/components/recurring/recurring-manager";

const models = [
  {
    id: "r1",
    label: "Loyer",
    type: "FIXED" as const,
    amount: "850.00",
    category: "essential" as const,
    subcategory: "housing",
    frequency: "MONTHLY" as const,
    anchorMonth: "2026-01",
    endMonth: null,
    active: true,
  },
];

describe("RecurringManager", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("opens the add overlay", async () => {
    render(<RecurringManager models={models} />);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter une récurrente" }));
    expect(screen.getByText("Nouvelle récurrente")).toBeInTheDocument();
  });

  it("deletes a model then refreshes", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<RecurringManager models={models} />);
    await userEvent.click(screen.getByRole("button", { name: "Supprimer la récurrente" }));
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring/r1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("shows an empty state when there is no model", () => {
    render(<RecurringManager models={[]} />);
    expect(screen.getByText(/Aucune dépense récurrente/)).toBeInTheDocument();
  });
});
