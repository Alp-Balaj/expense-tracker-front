import { describe, expect, it } from "vitest";

import {
  accountRoles,
  describeRecurrence,
  dueStanding,
  ordinal,
  sortQueue,
  sortTemplates,
  summarizeQueue,
} from "@/lib/planned";
import { PlannedKind, PlannedOccurrenceState, Recurrence } from "@/Enums/enums";
import type { PlannedOccurrence, PlannedTransaction } from "@/Models/PlannedTransaction";

const TODAY = "2026-07-27";

function occurrence(
  id: string,
  dueDate: string,
  amount: number,
  kind: PlannedKind = PlannedKind.Expense,
): PlannedOccurrence {
  return {
    id,
    plannedTransactionId: `t-${id}`,
    periodKey: dueDate.slice(0, 7),
    dueDate,
    state: PlannedOccurrenceState.Pending,
    committedAt: null,
    expenseId: null,
    incomeId: null,
    transferId: null,
    title: id,
    description: null,
    kind,
    amount,
    categoryId: "c1",
    fromAccountId: "a1",
    toAccountId: null,
    savingGoalId: null,
  };
}

function template(overrides: Partial<PlannedTransaction> = {}): PlannedTransaction {
  return {
    id: "t1",
    title: "Rent",
    amount: 800,
    description: null,
    kind: PlannedKind.Expense,
    categoryId: "c1",
    fromAccountId: "a1",
    toAccountId: null,
    savingGoalId: null,
    recurrence: Recurrence.Monthly,
    startDate: "2026-01-01",
    endDate: null,
    isActive: true,
    nextDueDate: "2026-08-01",
    pendingCount: 0,
    ...overrides,
  };
}

describe("ordinal", () => {
  it("handles the teens, which do not follow the last-digit rule", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 31].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "31st",
    ]);
  });
});

describe("describeRecurrence", () => {
  it("names the weekday a weekly schedule falls on", () => {
    // 2026-07-27 is a Monday.
    expect(describeRecurrence(Recurrence.Weekly, "2026-07-27")).toBe("Every Monday");
  });

  it("warns that a late-month anchor slides in short months", () => {
    // The user needs to know a 31st schedule will not always be the 31st,
    // because that is exactly what the server does with it.
    expect(describeRecurrence(Recurrence.Monthly, "2026-01-31")).toBe(
      "Monthly on the 31st (or the last day)",
    );
    expect(describeRecurrence(Recurrence.Monthly, "2026-01-15")).toBe("Monthly on the 15th");
  });

  it("describes yearly and one-off schedules", () => {
    expect(describeRecurrence(Recurrence.Yearly, "2026-07-04")).toBe("Yearly on 4 July");
    expect(describeRecurrence(Recurrence.Once, "2026-07-04")).toBe("One-off");
  });
});

describe("dueStanding", () => {
  it("reads overdue, today and ahead differently", () => {
    expect(dueStanding("2026-07-20", TODAY)).toMatchObject({
      daysUntil: -7,
      overdue: true,
      label: "Overdue by 7 days",
    });
    expect(dueStanding(TODAY, TODAY)).toMatchObject({ overdue: false, label: "Due today" });
    expect(dueStanding("2026-07-28", TODAY)).toMatchObject({ label: "Due in 1 day" });
  });
});

describe("sortQueue", () => {
  it("puts what you have owed longest first", () => {
    const sorted = sortQueue([
      occurrence("b", "2026-07-27", 10),
      occurrence("a", "2026-07-01", 10),
      occurrence("c", "2026-07-15", 10),
    ]);

    expect(sorted.map((o) => o.id)).toEqual(["a", "c", "b"]);
  });

  it("does not mutate its input", () => {
    const queue = [occurrence("b", "2026-07-27", 10), occurrence("a", "2026-07-01", 10)];
    sortQueue(queue);
    expect(queue.map((o) => o.id)).toEqual(["b", "a"]);
  });
});

describe("summarizeQueue", () => {
  it("separates what is owed from what is coming in, and ignores transfers", () => {
    const summary = summarizeQueue(
      [
        occurrence("rent", "2026-07-01", 800),
        occurrence("salary", "2026-07-25", 2500, PlannedKind.Income),
        // Between the user's own accounts, so neither owed nor incoming.
        occurrence("savings", "2026-07-26", 200, PlannedKind.Transfer),
      ],
      TODAY,
    );

    expect(summary).toEqual({ count: 3, overdue: 3, owed: 800, incoming: 2500 });
  });

  it("counts only what is genuinely past its date as overdue", () => {
    const summary = summarizeQueue(
      [occurrence("today", TODAY, 10), occurrence("late", "2026-07-01", 10)],
      TODAY,
    );

    expect(summary.overdue).toBe(1);
  });
});

describe("sortTemplates", () => {
  it("leads with what needs attention, then by what comes round soonest", () => {
    const sorted = sortTemplates([
      template({ id: "later", title: "Later", nextDueDate: "2026-09-01" }),
      template({ id: "paused", title: "Paused", isActive: false, pendingCount: 3 }),
      template({ id: "soon", title: "Soon", nextDueDate: "2026-08-01" }),
      template({ id: "waiting", title: "Waiting", pendingCount: 2, nextDueDate: "2026-12-01" }),
    ]);

    // A schedule with something waiting outranks one that is merely due sooner;
    // a paused one sorts last however much is stacked up behind it.
    expect(sorted.map((t) => t.id)).toEqual(["waiting", "soon", "later", "paused"]);
  });

  it("sorts a finished template after everything still running", () => {
    const sorted = sortTemplates([
      template({ id: "done", title: "Done", nextDueDate: null }),
      template({ id: "live", title: "Live", nextDueDate: "2026-08-01" }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual(["live", "done"]);
  });
});

describe("accountRoles", () => {
  it("asks for the account each kind actually uses", () => {
    expect(accountRoles(PlannedKind.Expense)).toEqual({ from: true, to: false });
    expect(accountRoles(PlannedKind.Income)).toEqual({ from: false, to: true });
    expect(accountRoles(PlannedKind.Transfer)).toEqual({ from: true, to: true });
  });
});
