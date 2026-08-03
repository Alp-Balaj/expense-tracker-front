import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileJson, FileSpreadsheet, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useAuthenticationApi } from "@/Hooks/useAuthenticationApi";
import { getApiErrorMessage } from "@/lib/errors";
import {
  deleteAccountApi,
  downloadCsvExportApi,
  downloadJsonExportApi,
} from "@/Services/exportServices";

/**
 * C·4: take everything with you, then leave if you want to.
 *
 * The two sit on one panel deliberately. Deleting an account is irreversible
 * and the export is the only thing that makes it survivable, so the way out is
 * placed directly under the way to keep your history — not on some other screen
 * the person is expected to have visited first.
 */
export function ExportPanel() {
  const navigate = useNavigate();
  const { logout } = useAuthenticationApi();

  const [downloading, setDownloading] = useState<"json" | "csv" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDownload = async (kind: "json" | "csv") => {
    setDownloading(kind);
    try {
      await (kind === "json" ? downloadJsonExportApi() : downloadCsvExportApi());
    } catch (e) {
      toast.error(getApiErrorMessage(e, "The export failed."));
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccountApi(password);
      // The account is gone; the local session is meaningless now.
      await logout();
      navigate("/login");
      toast.success("Your account and everything in it have been deleted.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "The account could not be deleted."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">Download everything</h2>
          <p className="text-sm text-muted-foreground">
            Your accounts, transactions, budgets, goals and planned payments — all of it,
            any time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => void handleDownload("json")}
            disabled={downloading !== null}
          >
            {downloading === "json" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileJson className="mr-2 h-4 w-4" />
            )}
            Everything (JSON)
          </Button>

          <Button
            variant="outline"
            onClick={() => void handleDownload("csv")}
            disabled={downloading !== null}
          >
            {downloading === "csv" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Transactions (CSV)
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          The JSON keeps every relationship and can rebuild your history elsewhere. The CSV
          is one sheet of transactions — the one a spreadsheet opens.
        </p>
      </section>

      <section className="space-y-3 rounded-md border border-destructive/40 p-4">
        <div className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Delete this account</h2>
            <p className="text-sm text-muted-foreground">
              Every account, transaction, budget, goal and planned payment goes with it.
              This cannot be undone, so download your data first.
            </p>
          </div>
        </div>

        {!confirming ? (
          <Button variant="outline" onClick={() => setConfirming(true)}>
            <Download className="mr-2 h-4 w-4 rotate-180" />
            Delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="delete-password" className="text-xs">
                Type your password to confirm
              </Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* A dialog protects against a misclick. A password protects against
                  someone else's hands on an unlocked laptop, which is the case
                  that actually loses years of history. */}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                disabled={password.length === 0 || deleting}
                onClick={() => void handleDelete()}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Permanently delete everything
              </Button>
              <Button
                variant="ghost"
                disabled={deleting}
                onClick={() => {
                  setConfirming(false);
                  setPassword("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
