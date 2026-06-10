import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/lib/notifications";

describe("NotificationList", () => {
  it("renders nothing when empty", () => {
    const { container } = renderWithIntl(<NotificationList items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one banner per notification with translated text", () => {
    const items: Notification[] = [
      {
        id: "budget-b1",
        kind: "budgetWarning",
        tone: "warning",
        values: { name: "Sport", percent: 85 },
      },
      {
        id: "category-leisure",
        kind: "categoryOver",
        tone: "over",
        values: { category: "leisure" },
      },
      {
        id: "budget-s1",
        kind: "savingsGoalNear",
        tone: "accent",
        values: { name: "Fonds", remaining: "100", reached: false },
      },
    ];
    renderWithIntl(<NotificationList items={items} />);
    expect(screen.getAllByTestId("soft-banner")).toHaveLength(3);
    expect(screen.getByText(/Sport \(85 %\)/)).toBeInTheDocument();
    expect(screen.getByText(/Loisirs/)).toBeInTheDocument();
    expect(screen.getByText(/Fonds/)).toBeInTheDocument();
  });
});
