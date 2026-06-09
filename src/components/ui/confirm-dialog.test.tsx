import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

describe("ConfirmDialog", () => {
  it("renders the title and fires confirm/cancel", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Supprimer ?"
        message="Action définitive"
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText("Supprimer ?")).toBeInTheDocument();
    expect(screen.getByText("Action définitive")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("cancels when the scrim is clicked", async () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Supprimer ?" onConfirm={() => {}} onCancel={onCancel} />);
    await userEvent.click(screen.getByTestId("dialog-scrim"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
