import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { Checkbox } from "@/Components/ui/checkbox";
import { Label } from "@/Components/ui/label";
import LoadingSpinner from "@/Components/General/LoadingSpinner";
import { getApiErrorMessage } from "@/lib/errors";
import {
  decideAuthorizeRequestApi,
  describeAuthorizeRequestApi,
  type AuthorizeRequestInfo,
} from "@/Services/oauthServices";

/**
 * The OAuth authorization endpoint: where claude.ai (or any MCP client that signs in
 * rather than taking a pasted token) sends the browser.
 *
 * Behind RequireAuth, so a signed-out visitor logs in and is returned here with the
 * query string intact. The page itself decides nothing: the server validates the
 * request both when describing it and when recording the decision, and the page only
 * follows the redirect it is handed — back to the client with a code or an error.
 *
 * Write access is opt-in, as it is for a pasted token, even when the client asks for
 * it: logging an expense moves a real balance.
 */
export default function OAuthAuthorizePage() {
  const { search } = useLocation();
  const [info, setInfo] = useState<AuthorizeRequestInfo | null>(null);
  const [fatal, setFatal] = useState("");
  const [canWrite, setCanWrite] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    describeAuthorizeRequestApi(search)
      .then((result) => {
        if (cancelled) return;
        if (result.error_redirect_url) window.location.assign(result.error_redirect_url);
        else setInfo(result);
      })
      .catch((e) => !cancelled && setFatal(getApiErrorMessage(e, "This sign-in request is not valid.")));
    return () => {
      cancelled = true;
    };
  }, [search]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    try {
      window.location.assign(await decideAuthorizeRequestApi(search, approve, approve && canWrite));
    } catch (e) {
      setFatal(getApiErrorMessage(e, "Something went wrong. Start the connection again from the app."));
      setBusy(false);
    }
  };

  if (!info && !fatal) return <LoadingSpinner />;

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 py-8">
          <span
            aria-hidden
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Sparkles className="h-5 w-5" />
          </span>

          {fatal ? (
            <div className="space-y-2 text-center">
              <p className="font-medium text-foreground">This connection cannot continue</p>
              <p className="text-sm text-muted-foreground">{fatal}</p>
            </div>
          ) : (
            <>
              <div className="space-y-1 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {info!.client_name} wants to connect to ExpenseTracker
                </p>
                <p className="text-sm text-muted-foreground">
                  You will be sent back to <span className="font-medium text-foreground">{info!.redirect_host}</span>
                </p>
              </div>

              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Read your accounts, balances, categories and transactions</li>
                <li>Read your budgets, spending insights and cashflow projection</li>
              </ul>

              {info!.requested_write && (
                <div className="flex items-start gap-2 rounded-md border border-border p-3">
                  <Checkbox
                    id="oauth-can-write"
                    checked={canWrite}
                    onCheckedChange={(checked) => setCanWrite(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="oauth-can-write">Also allow logging expenses and income</Label>
                    <p className="text-xs text-muted-foreground">
                      This changes your real balances. It can only add entries, never edit or delete them.
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                You can disconnect at any time under Settings → AI. Changing your password disconnects every app.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button onClick={() => decide(true)} disabled={busy} className="h-11 flex-1">
                  Allow
                </Button>
                <Button variant="ghost" onClick={() => decide(false)} disabled={busy} className="h-11 flex-1">
                  Deny
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
