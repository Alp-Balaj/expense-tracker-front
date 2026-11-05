import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Trash2 } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  createMcpTokenApi,
  listMcpTokensApi,
  mcpEndpointUrl,
  revokeMcpTokenApi,
  type CreatedMcpToken,
  type McpToken,
} from "@/Services/mcpTokenServices";

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all rounded-md bg-muted px-2 py-1.5 text-xs">{value}</code>
      <Button type="button" variant="outline" size="icon" onClick={copy} aria-label={`Copy ${label}`}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

/** Gated on `active` so the list is only fetched once the tab is actually open. */
export function McpTokenSettings({ active }: { active: boolean }) {
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [name, setName] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [created, setCreated] = useState<CreatedMcpToken | null>(null);
  const [confirmingRevoke, setConfirmingRevoke] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setTokens(await listMcpTokensApi());
    } catch {
      setError("Could not load your tokens.");
    }
  }, []);

  useEffect(() => {
    if (active) void load();
    // The raw token must not outlive the moment: closing the screen forgets it.
    else setCreated(null);
  }, [active, load]);

  const handleCreate = async () => {
    setError("");
    if (!name.trim()) return setError("Give the token a name");

    setBusy(true);
    try {
      setCreated(await createMcpTokenApi(name.trim(), canWrite));
      setName("");
      setCanWrite(false);
      await load();
    } catch {
      setError("Creating the token failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setError("");
    setBusy(true);
    try {
      await revokeMcpTokenApi(id);
      setConfirmingRevoke(null);
      if (created?.id === id) setCreated(null);
      await load();
    } catch {
      setError("Revoking the token failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Connect an AI assistant</Label>
        <p className="text-xs text-muted-foreground">
          Tokens let an MCP client such as Claude Code read your accounts, spending and budgets. A token works only
          for this connection, never for signing in. Changing your password revokes all of them.
        </p>
        <CopyBlock label="server URL" value={mcpEndpointUrl()} />
      </div>

      {created ? (
        <div className="space-y-3 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Copy this token now. You won't see it again.</p>
          <CopyBlock label="token" value={created.token} />
          <p className="text-xs text-muted-foreground">To add it to Claude Code, run:</p>
          <CopyBlock
            label="command"
            value={`claude mcp add --transport http expense-tracker ${mcpEndpointUrl()} --header "Authorization: Bearer ${created.token}"`}
          />
          <Button type="button" variant="outline" className="w-full" onClick={() => setCreated(null)}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor="mcp-token-name">Token name</Label>
            <Input
              id="mcp-token-name"
              value={name}
              maxLength={100}
              placeholder="Laptop Claude Code"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="mcp-token-write"
              checked={canWrite}
              onCheckedChange={(checked) => setCanWrite(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="mcp-token-write">Allow logging expenses and income</Label>
              <p className="text-xs text-muted-foreground">
                This changes your real balances. It can only add entries, never edit or delete them.
              </p>
            </div>
          </div>
          <Button type="button" onClick={handleCreate} disabled={busy} className="w-full bg-primary text-primary-foreground">
            Create token
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {tokens.length > 0 && (
        <ul className="space-y-2 border-t border-border pt-4">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm">{token.name}</p>
                <p className="text-xs text-muted-foreground">
                  ••••{token.lastFour} · {token.canWrite ? "Read and log" : "Read only"} ·{" "}
                  {token.lastUsedAtUtc ? `Last used ${formatDate(token.lastUsedAtUtc)}` : "Never used"}
                </p>
              </div>
              {confirmingRevoke === token.id ? (
                <div className="flex shrink-0 gap-1">
                  <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => handleRevoke(token.id)}>
                    Revoke
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingRevoke(null)}>
                    Keep
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`Revoke ${token.name}`}
                  onClick={() => setConfirmingRevoke(token.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
