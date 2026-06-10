import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import Home from "@/app/page";
import { redirect } from "next/navigation";

describe("Home", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to the dashboard", () => {
    Home();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
