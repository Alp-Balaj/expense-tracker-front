import { api } from "./api";

export const EXPORT_API = "api/Export";

/**
 * Downloads one of the two export formats.
 *
 * Fetched through axios rather than opened with `window.open`: the API is
 * bearer-authenticated, and a plain navigation carries no Authorization header
 * — it would land on a 401 page instead of a file. So the bytes come back as a
 * blob and are handed to the browser as a synthetic download.
 */
async function download(path: string, fallbackName: string): Promise<void> {
  const response = await api.get<Blob>(path, { responseType: "blob" });

  // The server names the file (with the date in it); fall back if a proxy
  // stripped the header.
  const disposition = response.headers["content-disposition"];
  const match = typeof disposition === "string" ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition) : null;
  const name = match ? decodeURIComponent(match[1]) : fallbackName;

  const url = URL.createObjectURL(response.data);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    // Without this the blob is pinned in memory for the life of the document,
    // and a full export is not small.
    URL.revokeObjectURL(url);
  }
}

export const downloadJsonExportApi = () =>
  download(`${EXPORT_API}/json`, "expensetracker-export.json");

export const downloadCsvExportApi = () =>
  download(`${EXPORT_API}/csv`, "expensetracker-export.csv");

export const deleteAccountApi = async (password: string): Promise<void> => {
  await api.post("api/User/delete-account", { password });
};
