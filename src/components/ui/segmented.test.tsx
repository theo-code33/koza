import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Segmented } from "@/components/ui/segmented";

describe("Segmented", () => {
  const options = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
  ];

  it("marks the active option as pressed", () => {
    render(<Segmented options={options} value="fr" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Français" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("calls onChange with the chosen value", async () => {
    const onChange = vi.fn();
    render(<Segmented options={options} value="fr" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onChange).toHaveBeenCalledWith("en");
  });
});
