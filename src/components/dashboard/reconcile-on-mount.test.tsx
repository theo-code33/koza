import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const { refresh, reconcileAction } = vi.hoisted(() => ({
  refresh: vi.fn(),
  reconcileAction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/actions/reconcile", () => ({ reconcileAction }));

import { ReconcileOnMount } from "@/components/dashboard/reconcile-on-mount";

describe("ReconcileOnMount", () => {
  beforeEach(() => {
    refresh.mockClear();
    reconcileAction.mockClear();
  });

  it("runs reconcile once then refreshes", async () => {
    render(<ReconcileOnMount />);
    await waitFor(() => expect(reconcileAction).toHaveBeenCalledOnce());
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
