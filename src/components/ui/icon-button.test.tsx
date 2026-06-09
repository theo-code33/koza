import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChevronLeft } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";

describe("IconButton", () => {
  it("fires onClick and exposes its label", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={ChevronLeft} label="Mois précédent" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is inert when disabled", async () => {
    const onClick = vi.fn();
    render(<IconButton icon={ChevronLeft} label="Mois précédent" onClick={onClick} disabled />);
    await userEvent.click(screen.getByRole("button", { name: "Mois précédent" }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
