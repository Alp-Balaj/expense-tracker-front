import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportPanel } from "@/Components/Export/ExportPanel";
import * as exportServices from "@/Services/exportServices";
import * as authHooks from "@/Hooks/useAuthenticationApi";

// C·4 from the browser's side.
//
// Deleting an account is the most destructive thing this app can do and it runs
// against real financial history, so the tests here are mostly about what has to
// be true *before* the destructive call is reachable: the export is offered
// first, the button is not armed by default, and a password is required rather
// than a confirmation click.

vi.mock("@/Services/exportServices");
vi.mock("@/Hooks/useAuthenticationApi");

const logout = vi.fn();

function renderPanel() {
  return render(
    <MemoryRouter>
      <ExportPanel />
    </MemoryRouter>
  );
}

describe("ExportPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exportServices.downloadJsonExportApi).mockResolvedValue(undefined);
    vi.mocked(exportServices.downloadCsvExportApi).mockResolvedValue(undefined);
    vi.mocked(exportServices.deleteAccountApi).mockResolvedValue(undefined);
    vi.spyOn(authHooks, "useAuthenticationApi").mockReturnValue({
      logout,
    } as unknown as ReturnType<typeof authHooks.useAuthenticationApi>);
  });

  it("offers both export formats", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /everything \(json\)/i }));
    expect(exportServices.downloadJsonExportApi).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: /transactions \(csv\)/i }));
    expect(exportServices.downloadCsvExportApi).toHaveBeenCalledOnce();
  });

  it("does not arm the delete button until it is asked for", () => {
    renderPanel();

    // The first click only reveals the confirmation; nothing destructive is one
    // click away from a person looking around the page.
    expect(screen.getByRole("button", { name: /delete my account/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /permanently delete everything/i })
    ).not.toBeInTheDocument();
  });

  it("will not delete without a password", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /delete my account/i }));

    expect(screen.getByRole("button", { name: /permanently delete everything/i })).toBeDisabled();
    expect(exportServices.deleteAccountApi).not.toHaveBeenCalled();
  });

  it("deletes, then ends the session", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /delete my account/i }));
    await user.type(screen.getByLabelText(/type your password/i), "P@ssw0rd-123!");
    await user.click(screen.getByRole("button", { name: /permanently delete everything/i }));

    await waitFor(() => {
      expect(exportServices.deleteAccountApi).toHaveBeenCalledWith("P@ssw0rd-123!");
    });
    // The account is gone; leaving the session alive would leave a token that
    // authenticates nothing.
    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it("keeps the session when the password was wrong", async () => {
    vi.mocked(exportServices.deleteAccountApi).mockRejectedValue(new Error("nope"));

    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /delete my account/i }));
    await user.type(screen.getByLabelText(/type your password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /permanently delete everything/i }));

    await waitFor(() => expect(exportServices.deleteAccountApi).toHaveBeenCalled());
    expect(logout).not.toHaveBeenCalled();
  });

  it("can be backed out of", async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("button", { name: /delete my account/i }));
    await user.type(screen.getByLabelText(/type your password/i), "typed something");
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(
      screen.queryByRole("button", { name: /permanently delete everything/i })
    ).not.toBeInTheDocument();

    // And the typed password does not survive the retreat.
    await user.click(screen.getByRole("button", { name: /delete my account/i }));
    expect(screen.getByLabelText(/type your password/i)).toHaveValue("");
  });

  it("tells you to download your data before deleting", () => {
    renderPanel();

    expect(screen.getByText(/download your data first/i)).toBeInTheDocument();
  });
});
