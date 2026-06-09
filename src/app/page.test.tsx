import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/settings", () => ({ getOnboardingCompleted: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import Home from "@/app/page";
import { getOnboardingCompleted } from "@/lib/settings";
import { redirect } from "next/navigation";

describe("Home gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to /welcome when onboarding is not complete", async () => {
    vi.mocked(getOnboardingCompleted).mockResolvedValue(false);
    await Home();
    expect(redirect).toHaveBeenCalledWith("/welcome");
  });

  it("renders the placeholder when onboarding is complete", async () => {
    vi.mocked(getOnboardingCompleted).mockResolvedValue(true);
    render(await Home());
    expect(screen.getByRole("heading", { name: "kōza" })).toBeInTheDocument();
  });
});
