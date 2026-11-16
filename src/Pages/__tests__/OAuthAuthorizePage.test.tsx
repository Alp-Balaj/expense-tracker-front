import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import OAuthAuthorizePage from "@/Pages/OAuthAuthorizePage";
import { decideAuthorizeRequestApi, describeAuthorizeRequestApi } from "@/Services/oauthServices";

// The consent screen decides nothing itself — the server validates and hands back
// where to go. What matters here: it names the client and the redirect host, write
// access is opt-in, and it never redirects anywhere the server did not return.

vi.mock("@/Services/oauthServices", () => ({
  describeAuthorizeRequestApi: vi.fn(),
  decideAuthorizeRequestApi: vi.fn(),
}));

const SEARCH = "?response_type=code&client_id=etc_1&redirect_uri=https%3A%2F%2Fclaude.ai%2Fcb&state=s";
const assign = vi.fn();

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/oauth/authorize${SEARCH}`]}>
      <Routes>
        <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("OAuthAuthorizePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", { value: { ...window.location, assign }, writable: true });
    vi.mocked(decideAuthorizeRequestApi).mockResolvedValue("https://claude.ai/cb?code=abc&state=s");
  });

  it("names the client and where the browser goes next", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({
      client_name: "Claude",
      redirect_host: "claude.ai",
      requested_write: true,
    });
    renderPage();

    expect(await screen.findByText("Claude wants to connect to ExpenseTracker")).toBeInTheDocument();
    expect(screen.getByText("claude.ai")).toBeInTheDocument();
    expect(describeAuthorizeRequestApi).toHaveBeenCalledWith(SEARCH);
  });

  it("grants read-only unless write access is ticked", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({
      client_name: "Claude",
      redirect_host: "claude.ai",
      requested_write: true,
    });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Allow" }));

    expect(decideAuthorizeRequestApi).toHaveBeenCalledWith(SEARCH, true, false);
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://claude.ai/cb?code=abc&state=s"));
  });

  it("passes write access through when ticked", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({
      client_name: "Claude",
      redirect_host: "claude.ai",
      requested_write: true,
    });
    renderPage();

    await userEvent.click(await screen.findByLabelText("Also allow logging expenses and income"));
    await userEvent.click(screen.getByRole("button", { name: "Allow" }));

    expect(decideAuthorizeRequestApi).toHaveBeenCalledWith(SEARCH, true, true);
  });

  it("does not offer write access the client did not ask for", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({
      client_name: "Claude",
      redirect_host: "claude.ai",
      requested_write: false,
    });
    renderPage();

    await screen.findByRole("button", { name: "Allow" });
    expect(screen.queryByLabelText("Also allow logging expenses and income")).not.toBeInTheDocument();
  });

  it("denying reports back to the client", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({ client_name: "Claude", redirect_host: "claude.ai" });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Deny" }));

    expect(decideAuthorizeRequestApi).toHaveBeenCalledWith(SEARCH, false, false);
  });

  it("shows the server's message and redirects nowhere when the request is not genuine", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "This app asked to send you to an address it did not register." } },
    });
    renderPage();

    expect(await screen.findByText("This connection cannot continue")).toBeInTheDocument();
    expect(assign).not.toHaveBeenCalled();
  });

  it("follows the server's error redirect for a malformed but genuine request", async () => {
    vi.mocked(describeAuthorizeRequestApi).mockResolvedValue({
      error_redirect_url: "https://claude.ai/cb?error=invalid_request&state=s",
    });
    renderPage();

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://claude.ai/cb?error=invalid_request&state=s"));
  });
});
