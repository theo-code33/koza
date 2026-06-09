import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MonthNav } from "@/components/ui/month-nav";

describe("MonthNav", () => {
  it("shows the title and subtitle", () => {
    render(
      <MonthNav
        title="Juin 2026"
        subtitle="En cours"
        canPrev
        canNext={false}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(screen.getByText("Juin 2026")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
  });

  it("disables next navigation when canNext is false", async () => {
    const onNext = vi.fn();
    render(
      <MonthNav title="Juin 2026" canPrev canNext={false} onPrev={() => {}} onNext={onNext} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mois suivant" }));
    expect(onNext).not.toHaveBeenCalled();
  });
});
