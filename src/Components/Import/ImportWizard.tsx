import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { useCategoriesQuery } from "@/Hooks/queries/useCategories";
import { queryKeys } from "@/Hooks/queries/queryKeys";
import { getApiErrorMessage } from "@/lib/errors";
import {
  applyProfile,
  deleteImportProfile,
  listImportProfiles,
  saveImportProfile,
} from "@/lib/importProfiles";
import {
  EMPTY_MAPPING,
  isMappingComplete,
  type ImportMapping,
  type ImportPreview,
  type ImportProfile,
  type ImportResult,
} from "@/Models/Import";
import { commitImportApi, previewImportApi } from "@/Services/importServices";
import { ImportMappingForm } from "./ImportMappingForm";
import { ImportPreviewTable } from "./ImportPreviewTable";

/** Long enough that adjusting a select doesn't fire a request per keystroke. */
const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Suggestion-6's import flow: drop a file, confirm how to read it, see exactly
 * what would be created, then commit.
 *
 * The preview is re-requested from the server on every mapping change rather
 * than parsed in the browser. That costs a round trip per adjustment and buys
 * the property that matters: what the preview shows is what the commit will do,
 * because both come from the same parser.
 */
export function ImportWizard() {
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();

  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<ImportMapping>(EMPTY_MAPPING);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [profiles, setProfiles] = useState<ImportProfile[]>(() => listImportProfiles());
  const [profileName, setProfileName] = useState("");

  // Guards a preview response that arrives after the mapping moved on again.
  const previewToken = useRef(0);

  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setMapping(EMPTY_MAPPING);
  }, []);

  const handleFile = useCallback(
    async (chosen: File) => {
      setFile(chosen);
      setResult(null);
      setIsPreviewing(true);

      try {
        // First look: no mapping, so the server answers with the columns it found
        // and its guess at which is which.
        const inspected = await previewImportApi(chosen, null);
        setPreview(inspected);

        setMapping((current) => ({
          ...current,
          delimiter: inspected.delimiter,
          dateColumn: current.dateColumn >= 0 ? current.dateColumn : inspected.suggested.dateColumn ?? -1,
          amountColumn: current.amountColumn >= 0 ? current.amountColumn : inspected.suggested.amountColumn ?? -1,
          descriptionColumn:
            current.descriptionColumn >= 0
              ? current.descriptionColumn
              : inspected.suggested.descriptionColumn ?? -1,
          counterpartyColumn: current.counterpartyColumn ?? inspected.suggested.counterpartyColumn,
        }));
      } catch (e) {
        toast.error(getApiErrorMessage(e, "Could not read that file."));
        setFile(null);
      } finally {
        setIsPreviewing(false);
      }
    },
    []
  );

  // Re-preview whenever the mapping becomes (or stays) complete.
  useEffect(() => {
    if (!file || !isMappingComplete(mapping)) return;

    const token = ++previewToken.current;
    const timer = setTimeout(async () => {
      setIsPreviewing(true);
      try {
        const next = await previewImportApi(file, mapping);
        if (previewToken.current === token) setPreview(next);
      } catch (e) {
        if (previewToken.current === token) {
          toast.error(getApiErrorMessage(e, "Could not preview that mapping."));
        }
      } finally {
        if (previewToken.current === token) setIsPreviewing(false);
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [file, mapping]);

  const handleCommit = async () => {
    if (!file || !isMappingComplete(mapping)) return;

    setIsCommitting(true);
    try {
      const committed = await commitImportApi(file, mapping);
      setResult(committed);

      // An import touches balances, both transaction lists, and everything
      // derived from them.
      for (const key of [
        queryKeys.expenses,
        queryKeys.incomes,
        queryKeys.accounts,
        queryKeys.budgetStatusRoot,
        queryKeys.insights,
        queryKeys.cashflowProjection,
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }

      toast.success(`Imported ${committed.imported} row${committed.imported === 1 ? "" : "s"}.`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "The import failed."));
    } finally {
      setIsCommitting(false);
    }
  };

  const complete = isMappingComplete(mapping);
  const currencyCode = accounts.find((a) => a.id === mapping.accountId)?.currencyCode;

  // ── Committed ──────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-border bg-card p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              {result.imported} imported, {result.duplicatesSkipped} already there,{" "}
              {result.failed} skipped
            </p>
            <p className="text-xs text-muted-foreground">
              {result.expenseTotal.toFixed(2)} out, {result.incomeTotal.toFixed(2)} in
              {currencyCode ? ` (${currencyCode})` : ""}.
            </p>
          </div>
        </div>

        {result.problems.length > 0 && (
          <div className="space-y-1 rounded-md border border-border p-3">
            <p className="text-xs font-semibold">Rows that were left behind</p>
            <ul className="space-y-0.5">
              {result.problems.map((problem) => (
                <li key={problem.rowNumber} className="text-xs text-muted-foreground">
                  Line {problem.rowNumber}: {problem.reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={reset} variant="outline">
          Import another file
        </Button>
      </div>
    );
  }

  // ── Choosing a file ────────────────────────────────────────────────────

  if (!file || !preview) {
    return (
      <div className="space-y-4">
        <label
          htmlFor="import-file"
          className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center transition-colors hover:border-primary/60 hover:bg-muted/40"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) void handleFile(dropped);
          }}
        >
          <FileUp className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">Drop a CSV statement, or choose one</span>
          <span className="text-xs text-muted-foreground">
            Nothing is saved until you have seen exactly what it would create.
          </span>
          <Input
            id="import-file"
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) void handleFile(chosen);
            }}
          />
        </label>

        {isPreviewing && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Reading the file…
          </p>
        )}
      </div>
    );
  }

  // ── Mapping and preview ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            {preview.columns.length} columns · {preview.totalRows} rows
            {preview.truncated ? " · only the first 5000 are read" : ""}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          Choose a different file
        </Button>
      </div>

      {profiles.length > 0 && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 space-y-1.5">
            <Label className="text-xs">Saved format</Label>
            <Select
              value=""
              onValueChange={(id) => {
                const profile = profiles.find((p) => p.id === id);
                if (profile) {
                  setMapping(applyProfile(profile));
                  setProfileName(profile.name);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Load a saved format" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {profileName && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const match = profiles.find((p) => p.name === profileName);
                if (match) setProfiles(deleteImportProfile(match.id));
                setProfileName("");
              }}
            >
              Forget
            </Button>
          )}
        </div>
      )}

      <ImportMappingForm
        mapping={mapping}
        columns={preview.columns}
        accounts={accounts}
        categories={categories}
        onChange={setMapping}
      />

      <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <div className="min-w-[12rem] flex-1 space-y-1.5">
          <Label htmlFor="import-profile-name" className="text-xs">
            Remember this format as
          </Label>
          <Input
            id="import-profile-name"
            placeholder="e.g. Sparkasse"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          disabled={!profileName.trim()}
          onClick={() => {
            setProfiles(saveImportProfile(profileName, mapping));
            toast.success(`Saved "${profileName.trim()}".`);
          }}
        >
          <Save className="mr-2 h-4 w-4" />
          Save format
        </Button>
      </div>

      {complete && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">
              {preview.readyCount} will import
            </span>
            <span className="text-muted-foreground">
              {preview.duplicateCount} already there
            </span>
            <span className={preview.problemCount > 0 ? "text-destructive" : "text-muted-foreground"}>
              {preview.problemCount} unreadable
            </span>
            {isPreviewing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <div className="rounded-md border border-border p-2">
            <ImportPreviewTable rows={preview.rows} currencyCode={currencyCode} />
          </div>

          <Button
            onClick={handleCommit}
            disabled={isCommitting || isPreviewing || preview.readyCount === 0}
            className="w-full bg-primary text-primary-foreground sm:w-auto"
          >
            {isCommitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import {preview.readyCount} row{preview.readyCount === 1 ? "" : "s"}
          </Button>
        </div>
      )}

      {!complete && (
        <p className="text-sm text-muted-foreground">
          Choose an account, the date, amount and description columns, and both default
          categories to see what would be imported.
        </p>
      )}
    </div>
  );
}
