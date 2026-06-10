import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { PendingConfirmations } from "@/components/recurring/pending-confirmations";

const items = [{ id: "o1", label: "Électricité", estimate: "90.00" }];

describe("PendingConfirmations", () => {
  beforeEach(() => {
    refresh.mockClear();
    vi.restoreAllMocks();
  });

  it("confirms a variable occurrence with the real amount", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    render(<PendingConfirmations items={items} />);
    await userEvent.type(screen.getByLabelText("Montant réel pour Électricité"), "104.30");
    await userEvent.click(screen.getByRole("button", { name: "Confirmer Électricité" }));
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/recurring/occurrences/o1/confirm",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renders nothing when there is no pending item", () => {
    const { container } = render(<PendingConfirmations items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
