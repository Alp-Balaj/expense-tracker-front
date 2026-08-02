import { EMPTY_MAPPING, type ImportMapping, type ImportProfile } from "@/Models/Import";

/**
 * Saved import mappings — Suggestion-6's "profile", so that month two is one
 * click instead of a re-mapping.
 *
 * <h3>Why these live in the browser</h3>
 * The note proposed a server-side entity. Stream G is a no-migration stream (the
 * migration lock is held by P → M → O), and a mapping is a preference rather
 * than financial data: losing one costs a minute of re-mapping, not a record of
 * money. So it goes where the app's other per-browser settings go.
 *
 * The honest cost, worth writing down: a profile saved on a laptop is not on the
 * phone. That is tolerable specifically for this feature — importing a statement
 * begins with downloading a file from a bank, which is a desktop activity.
 * Promoting these to rows later is purely additive and needs nothing here to
 * change shape.
 */

const STORAGE_KEY = "expensetracker.importProfiles";
const MAX_PROFILES = 20;

function read(): ImportProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Anything malformed is dropped rather than crashing the page: this is a
    // convenience store, and a bad entry must never cost someone the import.
    return parsed.filter(isProfile).slice(0, MAX_PROFILES);
  } catch {
    return [];
  }
}

function isProfile(value: unknown): value is ImportProfile {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<ImportProfile>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    !!p.mapping &&
    typeof p.mapping === "object"
  );
}

function write(profiles: ImportProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.slice(0, MAX_PROFILES)));
  } catch {
    // Private mode, or a full quota. Not worth failing the import over.
  }
}

export function listImportProfiles(): ImportProfile[] {
  return read().sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Saves under `name`, replacing a profile of the same name rather than
 * accumulating "Sparkasse", "Sparkasse (2)", "Sparkasse (3)" — re-saving is
 * almost always a correction.
 */
export function saveImportProfile(name: string, mapping: ImportMapping): ImportProfile[] {
  const trimmed = name.trim();
  if (!trimmed) return listImportProfiles();

  const existing = read();
  const match = existing.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  const profile: ImportProfile = {
    id: match?.id ?? crypto.randomUUID(),
    name: trimmed,
    mapping: { ...mapping },
    updatedAt: new Date().toISOString(),
  };

  const next = match
    ? existing.map((p) => (p.id === match.id ? profile : p))
    : [profile, ...existing];

  write(next);
  return next.sort((a, b) => a.name.localeCompare(b.name));
}

export function deleteImportProfile(id: string): ImportProfile[] {
  const next = read().filter((p) => p.id !== id);
  write(next);
  return next.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Merges a saved profile over the defaults, so a profile written before a field
 * existed still loads. Column indexes come from the profile; everything absent
 * falls back rather than becoming undefined and reaching the API as null.
 */
export function applyProfile(profile: ImportProfile): ImportMapping {
  return { ...EMPTY_MAPPING, ...profile.mapping, rules: [...(profile.mapping.rules ?? [])] };
}
