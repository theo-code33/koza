import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Clock3 } from "lucide-react";
import { SoftBanner } from "@/components/ui/soft-banner";

describe("SoftBanner", () => {
  it("renders its message and fires the action", async () => {
    const onAction = vi.fn();
    render(
      <SoftBanner icon={Clock3} tone="warning" action="Confirmer" onAction={onAction}>
        Électricité à confirmer
      </SoftBanner>,
    );
    expect(screen.getByText("Électricité à confirmer")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirmer" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("uses the warning background tone", () => {
    render(
      <SoftBanner icon={Clock3} tone="warning">
        Info
      </SoftBanner>,
    );
    expect(screen.getByTestId("soft-banner").className).toContain("bg-warning-bg");
  });
});
