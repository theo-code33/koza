import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import userEvent from "@testing-library/user-event";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme }),
}));

import { ThemeToggle } from "@/components/settings/theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => setTheme.mockClear());

  it("reflects the light theme and switches to dark on click", async () => {
    render(<ThemeToggle />);
    const sw = screen.getByRole("switch", { name: "Activer le thème sombre" });
    expect(sw).toHaveAttribute("aria-checked", "false");
    await userEvent.click(sw);
    expect(setTheme).toHaveBeenCalledWith("dark");
  });
});
