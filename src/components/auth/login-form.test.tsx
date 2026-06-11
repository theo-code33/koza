import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render-with-intl";

vi.mock("@/app/actions/auth", () => ({ loginAction: vi.fn(), signupAction: vi.fn() }));

import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";

describe("auth forms", () => {
  it("renders the login form with translated fields", () => {
    renderWithIntl(<LoginForm />);
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders the signup form with translated fields", () => {
    renderWithIntl(<SignupForm />);
    expect(screen.getByRole("button", { name: "Créer mon compte" })).toBeInTheDocument();
  });
});
