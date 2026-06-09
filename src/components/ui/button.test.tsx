import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label and fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Ajouter</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Ajouter
      </Button>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies the accent background for the primary variant", () => {
    render(<Button>Ok</Button>);
    expect(screen.getByRole("button", { name: "Ok" }).className).toContain("bg-accent");
  });
});
