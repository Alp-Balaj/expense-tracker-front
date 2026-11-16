import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { McpTokenSettings } from "../McpTokenSettings";
import {
  createMcpTokenApi,
  listMcpTokensApi,
  revokeMcpTokenApi,
  type McpToken,
} from "@/Services/mcpTokenServices";

vi.mock("@/Services/mcpTokenServices", () => ({
  listMcpTokensApi: vi.fn(),
  createMcpTokenApi: vi.fn(),
  revokeMcpTokenApi: vi.fn(),
  mcpEndpointUrl: () => "https://app.test/api/mcp",
}));

const token = (overrides: Partial<McpToken> = {}): McpToken => ({
  id: crypto.randomUUID(),
  name: "Laptop",
  lastFour: "ab12",
  canWrite: false,
  createdAt: "2026-11-01T10:00:00Z",
  lastUsedAtUtc: null,
  viaOAuth: false,
  ...overrides,
});

describe("McpTokenSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listMcpTokensApi).mockResolvedValue([]);
  });

  it("does not fetch until its tab is open", () => {
    render(<McpTokenSettings active={false} />);
    expect(listMcpTokensApi).not.toHaveBeenCalled();
  });

  it("creates read-only tokens unless write access is ticked", async () => {
    vi.mocked(createMcpTokenApi).mockResolvedValue({ ...token(), token: "et_mcp_secret" });
    render(<McpTokenSettings active />);

    await userEvent.type(screen.getByLabelText("Token name"), "Laptop");
    await userEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(createMcpTokenApi).toHaveBeenCalledWith("Laptop", false);
  });

  it("passes write access through when it is ticked", async () => {
    vi.mocked(createMcpTokenApi).mockResolvedValue({ ...token(), token: "et_mcp_secret" });
    render(<McpTokenSettings active />);

    await userEvent.type(screen.getByLabelText("Token name"), "Laptop");
    await userEvent.click(screen.getByLabelText("Allow logging expenses and income"));
    await userEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(createMcpTokenApi).toHaveBeenCalledWith("Laptop", true);
  });

  it("requires a name", async () => {
    render(<McpTokenSettings active />);

    await userEvent.click(screen.getByRole("button", { name: "Create token" }));

    expect(createMcpTokenApi).not.toHaveBeenCalled();
    expect(screen.getByText("Give the token a name")).toBeInTheDocument();
  });

  it("shows the raw token once, then forgets it when the tab closes", async () => {
    vi.mocked(createMcpTokenApi).mockResolvedValue({ ...token(), token: "et_mcp_secret" });
    const { rerender } = render(<McpTokenSettings active />);

    await userEvent.type(screen.getByLabelText("Token name"), "Laptop");
    await userEvent.click(screen.getByRole("button", { name: "Create token" }));
    expect(await screen.findByText("et_mcp_secret")).toBeInTheDocument();

    rerender(<McpTokenSettings active={false} />);
    await waitFor(() => expect(screen.queryByText("et_mcp_secret")).not.toBeInTheDocument());
  });

  it("asks before revoking", async () => {
    const existing = token({ name: "Old laptop" });
    vi.mocked(listMcpTokensApi).mockResolvedValue([existing]);
    vi.mocked(revokeMcpTokenApi).mockResolvedValue();
    render(<McpTokenSettings active />);

    await userEvent.click(await screen.findByRole("button", { name: "Revoke Old laptop" }));
    expect(revokeMcpTokenApi).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(revokeMcpTokenApi).toHaveBeenCalledWith(existing.id);
  });

  it("describes what each token can do", async () => {
    vi.mocked(listMcpTokensApi).mockResolvedValue([
      token({ name: "Reader" }),
      token({ name: "Writer", canWrite: true, lastUsedAtUtc: "2026-11-02T10:00:00Z" }),
    ]);
    render(<McpTokenSettings active />);

    expect(await screen.findByText(/Read only · Never used/)).toBeInTheDocument();
    expect(screen.getByText(/Read and log · Last used/)).toBeInTheDocument();
  });
});

describe("McpTokenSettings OAuth connections", () => {
  it("labels a signed-in connection instead of showing a meaningless token suffix", async () => {
    vi.mocked(listMcpTokensApi).mockResolvedValue([token({ name: "Claude", viaOAuth: true, lastFour: "zz99" })]);
    render(<McpTokenSettings active />);

    expect(await screen.findByText("Claude")).toBeInTheDocument();
    expect(screen.getByText(/Signed in · Read only/)).toBeInTheDocument();
    expect(screen.queryByText(/zz99/)).not.toBeInTheDocument();
  });
});
