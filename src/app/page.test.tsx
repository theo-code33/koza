import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), useRouter: () => ({ push: vi.fn() }) }));

import Home from "@/app/page";

describe("Home", () => {
  it("renders the landing page", () => {
    const { container } = render(<Home />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
