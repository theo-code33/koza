import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl as render } from "@/test/render-with-intl";
import { StepIndicator } from "@/components/onboarding/step-indicator";

describe("StepIndicator", () => {
  it("exposes the current step and renders one segment per step", () => {
    render(<StepIndicator step={2} />);
    const indicator = screen.getByLabelText("Étape 2 sur 3");
    expect(indicator.children).toHaveLength(3);
  });
});
