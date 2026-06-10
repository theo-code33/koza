import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { DashboardMonthNav } from "@/components/dashboard/dashboard-month-nav";
import { currentMonth, previousMonth } from "@/lib/month";

describe("DashboardMonthNav", () => {
  beforeEach(() => push.mockClear());

  it("navigates to the previous month", async () => {
    render(<DashboardMonthNav month="2026-04" />);
    await userEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(push).toHaveBeenCalledWith(`/dashboard?month=${previousMonth("2026-04")}`);
  });

  it("disables next on the current month", () => {
    render(<DashboardMonthNav month={currentMonth()} />);
    expect(screen.getByRole("button", { name: "Mois suivant" })).toBeDisabled();
  });
});
