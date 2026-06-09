import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Overlay } from "@/components/ui/overlay";

describe("Overlay", () => {
  it("renders children", () => {
    render(
      <Overlay mode="panel" onClose={() => {}}>
        <p>panneau</p>
      </Overlay>,
    );
    expect(screen.getByText("panneau")).toBeInTheDocument();
  });

  it("calls onClose when the scrim is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Overlay mode="sheet" onClose={onClose}>
        <p>feuille</p>
      </Overlay>,
    );
    await userEvent.click(screen.getByTestId("overlay-scrim"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <Overlay mode="panel" onClose={onClose}>
        <p>panneau</p>
      </Overlay>,
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
