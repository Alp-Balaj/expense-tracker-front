import { beforeEach, describe, expect, it } from "vitest";

import {
  applyProfile,
  deleteImportProfile,
  listImportProfiles,
  saveImportProfile,
} from "@/lib/importProfiles";
import { EMPTY_MAPPING, type ImportMapping } from "@/Models/Import";

const STORAGE_KEY = "expensetracker.importProfiles";

const sparkasse: ImportMapping = {
  ...EMPTY_MAPPING,
  accountId: "acc-1",
  dateColumn: 0,
  descriptionColumn: 1,
  amountColumn: 2,
  culture: "de-DE",
  delimiter: ";",
  defaultExpenseCategoryId: "cat-e",
  defaultIncomeCategoryId: "cat-i",
  rules: [{ contains: "REWE", categoryId: "cat-groceries" }],
};

describe("import profiles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts empty", () => {
    expect(listImportProfiles()).toEqual([]);
  });

  it("round-trips a saved mapping", () => {
    saveImportProfile("Sparkasse", sparkasse);

    const [profile] = listImportProfiles();
    expect(profile.name).toBe("Sparkasse");
    expect(profile.mapping.culture).toBe("de-DE");
    expect(profile.mapping.rules).toEqual([{ contains: "REWE", categoryId: "cat-groceries" }]);
  });

  it("replaces a profile of the same name instead of accumulating copies", () => {
    saveImportProfile("Sparkasse", sparkasse);
    saveImportProfile("sparkasse", { ...sparkasse, culture: "en-US" });

    // Re-saving is almost always a correction, not a second bank.
    const profiles = listImportProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].mapping.culture).toBe("en-US");
  });

  it("keeps different banks apart", () => {
    saveImportProfile("Sparkasse", sparkasse);
    saveImportProfile("Revolut", { ...sparkasse, culture: "en-US", delimiter: "," });

    expect(listImportProfiles().map((p) => p.name)).toEqual(["Revolut", "Sparkasse"]);
  });

  it("ignores a blank name rather than saving an unnameable profile", () => {
    saveImportProfile("   ", sparkasse);
    expect(listImportProfiles()).toEqual([]);
  });

  it("deletes by id", () => {
    saveImportProfile("Sparkasse", sparkasse);
    const [profile] = listImportProfiles();

    expect(deleteImportProfile(profile.id)).toEqual([]);
    expect(listImportProfiles()).toEqual([]);
  });

  it("survives a corrupted store instead of taking the page down", () => {
    // This is a convenience store; a bad entry must never cost someone the import.
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(listImportProfiles()).toEqual([]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nope: true }));
    expect(listImportProfiles()).toEqual([]);

    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: "1" }, null, 42]));
    expect(listImportProfiles()).toEqual([]);
  });

  it("fills in fields a profile predates rather than sending undefined to the API", () => {
    const stale = {
      id: "old",
      name: "Old",
      updatedAt: "2026-01-01T00:00:00Z",
      // Saved before skipRows and negativeIsExpense existed.
      mapping: { accountId: "acc-1", dateColumn: 0, amountColumn: 1, descriptionColumn: 2 },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([stale]));

    const mapping = applyProfile(listImportProfiles()[0]);

    expect(mapping.skipRows).toBe(0);
    expect(mapping.negativeIsExpense).toBe(true);
    expect(mapping.rules).toEqual([]);
    expect(mapping.dateColumn).toBe(0);
  });

  it("copies the rules array so editing the form does not mutate the stored profile", () => {
    saveImportProfile("Sparkasse", sparkasse);
    const mapping = applyProfile(listImportProfiles()[0]);

    mapping.rules.push({ contains: "EDEKA", categoryId: "x" });

    expect(listImportProfiles()[0].mapping.rules).toHaveLength(1);
  });
});
