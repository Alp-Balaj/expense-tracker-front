import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { ResetPasswordForm } from "@/Components/UserAuthentication/ResetPasswordForm";
import { resetPasswordApi } from "@/Services/loginServices";

vi.mock("@/Services/loginServices", () => ({
  resetPasswordApi: vi.fn(),
}));

vi.mock("@/Authorization/AuthContext", () => ({
  useAuth: () => ({ accessToken: null }),
}));

const resetPasswordApiMock = vi.mocked(resetPasswordApi);

// What the emailed link carries. The token is URL-encoded in the mail; the
// router hands it back decoded, and that decoded value must reach the API.
const EMAIL = "alp@example.com";
const TOKEN = "CfDJ8-token+with/odd=chars";

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ResetPasswordForm />
    </MemoryRouter>
  );
}

function renderWithLink() {
  return renderAt(
    `/reset-password?email=${encodeURIComponent(EMAIL)}&token=${encodeURIComponent(TOKEN)}`
  );
}

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    resetPasswordApiMock.mockReset();
  });

  it("resets the password with the email and token from the link", async () => {
    resetPasswordApiMock.mockResolvedValueOnce(undefined);
    renderWithLink();

    // The screen says who it is resetting for.
    expect(screen.getByText(`Choose a new password for ${EMAIL}`)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("New password"), "N3w-Password!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "N3w-Password!");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(resetPasswordApiMock).toHaveBeenCalledWith(EMAIL, TOKEN, "N3w-Password!");
    expect(await screen.findByText(/your password has been reset/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to login/i })).toHaveAttribute("href", "/login");
  });

  it("rejects mismatched passwords without calling the API", async () => {
    renderWithLink();

    await userEvent.type(screen.getByLabelText("New password"), "N3w-Password!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "different");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });

  it("enforces the minimum password length", async () => {
    renderWithLink();

    await userEvent.type(screen.getByLabelText("New password"), "short");
    await userEvent.type(screen.getByLabelText("Confirm password"), "short");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(
      await screen.findByText("Password must be at least 8 characters")
    ).toBeInTheDocument();
    expect(resetPasswordApiMock).not.toHaveBeenCalled();
  });

  it("surfaces the server's rejection of a bad or expired token", async () => {
    resetPasswordApiMock.mockRejectedValueOnce(
      new Error("This reset link is invalid or has expired. Request a new one.")
    );
    renderWithLink();

    await userEvent.type(screen.getByLabelText("New password"), "N3w-Password!");
    await userEvent.type(screen.getByLabelText("Confirm password"), "N3w-Password!");
    await userEvent.click(screen.getByRole("button", { name: /reset password/i }));

    expect(
      await screen.findByText(/this reset link is invalid or has expired/i)
    ).toBeInTheDocument();
  });

  it("offers a fresh start when the link is missing its token", () => {
    renderAt(`/reset-password?email=${encodeURIComponent(EMAIL)}`);

    expect(screen.getByText(/this reset link is incomplete/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /request a new link/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    // No password fields to fill against a broken link.
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });
});
