import { api } from "./api";

export const MCP_TOKEN_API = "api/McpToken";

export interface McpToken {
  id: string;
  name: string;
  lastFour: string;
  canWrite: boolean;
  createdAt: string;
  lastUsedAtUtc: string | null;
  /** A connection made by signing in (claude.ai). Its token rotates, so lastFour means nothing. */
  viaOAuth: boolean;
}

/** The only shape that ever carries the raw token; the server cannot show it again. */
export interface CreatedMcpToken extends McpToken {
  token: string;
}

export const listMcpTokensApi = async (): Promise<McpToken[]> =>
  (await api.get<McpToken[]>(MCP_TOKEN_API)).data;

export const createMcpTokenApi = async (name: string, canWrite: boolean): Promise<CreatedMcpToken> =>
  (await api.post<CreatedMcpToken>(MCP_TOKEN_API, { name, canWrite })).data;

export const revokeMcpTokenApi = async (id: string): Promise<void> => {
  await api.delete(`${MCP_TOKEN_API}/${id}`);
};

/** Production is single-origin, so the API base is empty there and the page's origin is right. */
export const mcpEndpointUrl = (): string =>
  new URL("api/mcp", import.meta.env.VITE_API_BASE_URL || window.location.origin).toString();
