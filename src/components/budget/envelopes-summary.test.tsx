import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";
import { computeEnvelopes } from "@/lib/budget";
import { EnvelopesSummary } from "@/components/budget/envelopes-summary";

describe("EnvelopesSummary", () => {
  it("renders the three category envelopes with formatted amounts", () => {
    renderWithIntl(<EnvelopesSummary envelopes={computeEnvelopes("2500")} />);
    expect(screen.getByText("Essentiels")).toBeInTheDocument();
    expect(screen.getByText("Loisirs")).toBeInTheDocument();
    expect(screen.getByText("Épargne")).toBeInTheDocument();
    expect(screen.getByText(/1.?250,00/)).toBeInTheDocument();
  });
});
