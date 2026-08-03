import { api } from "./api";
import type { ImportMapping, ImportPreview, ImportResult } from "@/Models/Import";

export const IMPORT_API = "api/Import";

/**
 * The file rides with every call rather than being parked server-side between
 * the two phases: a preview of something the server is holding in memory is a
 * snapshot that can go stale, and re-sending it means preview and commit run
 * through literally the same parse.
 */
function body(file: File, mapping: ImportMapping | null): FormData {
  const form = new FormData();
  form.append("file", file);
  if (mapping) form.append("mapping", JSON.stringify(mapping));
  return form;
}

/** Pass `null` for the mapping to just look at the file's columns. */
export const previewImportApi = async (
  file: File,
  mapping: ImportMapping | null
): Promise<ImportPreview> =>
  (await api.post<ImportPreview>(`${IMPORT_API}/preview`, body(file, mapping))).data;

export const commitImportApi = async (
  file: File,
  mapping: ImportMapping
): Promise<ImportResult> =>
  (await api.post<ImportResult>(`${IMPORT_API}/commit`, body(file, mapping))).data;
