import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/render-with-intl";
import { CatSelect } from "@/components/ui/cat-select";

describe("CatSelect", () => {
  it("renders the three categories and marks the active one", () => {
    renderWithIntl(<CatSelect value="essential" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Essentiels" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Loisirs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Épargne" })).toBeInTheDocument();
  });

  it("calls onChange with the chosen category key", async () => {
    const onChange = vi.fn();
    renderWithIntl(<CatSelect value="essential" onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Loisirs" }));
    expect(onChange).toHaveBeenCalledWith("leisure");
  });
});
