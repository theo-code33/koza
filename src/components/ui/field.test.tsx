import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "@/components/ui/field";

describe("Field", () => {
  it("renders the label, child and hint", () => {
    render(
      <Field label="Montant" hint="En euros">
        <input aria-label="Montant" />
      </Field>,
    );
    expect(screen.getByText("Montant")).toBeInTheDocument();
    expect(screen.getByText("En euros")).toBeInTheDocument();
    expect(screen.getByLabelText("Montant")).toBeInTheDocument();
  });
});
