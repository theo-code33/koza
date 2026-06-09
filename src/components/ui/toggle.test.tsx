import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "@/components/ui/toggle";

describe("Toggle", () => {
  it("exposes switch role and aria-checked state", () => {
    render(<Toggle on label="Thème sombre" onChange={() => {}} />);
    const sw = screen.getByRole("switch", { name: "Thème sombre" });
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the toggled value", async () => {
    const onChange = vi.fn();
    render(<Toggle on={false} label="Thème sombre" onChange={onChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Thème sombre" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
