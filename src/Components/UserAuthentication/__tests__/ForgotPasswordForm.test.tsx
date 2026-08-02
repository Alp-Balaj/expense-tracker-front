import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { ForgotPasswordForm } from "@/Components/UserAuthentication/ForgotPasswordForm";
import { forgotPasswordApi } from "@/Services/loginServices";

// The screen talks to the API through the services module alone; mocking it is
// this repo's convention (no MSW in the toolchain — see the Pages tests).
vi.mock("@/Services/loginServices", () => ({
  forgotPasswordApi: vi.fn(),
}));

vi.mock("@/Authorization/AuthContext", () => ({
  useAuth: () => ({ accessToken: null }),
}));

const forgotPasswordApiMock = vi.mocked(forgotPasswordApi);

function renderForm() {
  return render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <ForgotPasswordForm />
    </MemoryRouter>
  );
}

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    forgotPasswordApiMock.mockReset();
  });

  it("requires an email before submitting", async () => {
    renderForm();

    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(forgotPasswordApiMock).not.toHaveBeenCalled();
  });

  it("sends the reset request and shows the always-the-same confirmation", async () => {
    forgotPasswordApiMock.mockResolvedValueOnce(undefined);
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "alp@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(forgotPasswordApiMock).toHaveBeenCalledWith("alp@example.com");
    // Anti-enumeration copy: identical whether or not the account exists.
    expect(
      await screen.findByText(/if that email is registered, a reset link is on its way/i)
    ).toBeInTheDocument();
    // The form is gone — no resubmitting the same address over and over.
    expect(screen.queryByRole("button", { name: /send reset link/i })).not.toBeInTheDocument();
  });

  it("surfaces a server failure and keeps the form usable", async () => {
    forgotPasswordApiMock.mockRejectedValueOnce(new Error("Too many requests"));
    renderForm();

    await userEvent.type(screen.getByLabelText("Email"), "alp@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(await screen.findByText("Too many requests")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeEnabled();
  });

  it("links back to the login screen", () => {
    renderForm();

    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });
});
