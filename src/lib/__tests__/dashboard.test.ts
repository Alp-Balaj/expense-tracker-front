import { describe, expect, it } from "vitest";
import {
  addDaysISO,
  billsDueWithin,
  buildSpendCalendar,
  cashRunwayDays,
  dailyBurn,
  daysBetween,
  daysInMonth,
  detectRecurring,
  frontedThisMonth,
  greeting,
  liquidPosition,
  monthCursor,
  owedToMe,
  recurringMonthlyTotal,
  splitAmountParts,
  upcomingBills,
  usableBalance,
} from "@/lib/dashboard";
import { AmountType, PlannedKind, PlannedOccurrenceState, Recurrence } from "@/Enums/enums";
import type { Account } from "@/Models/Account";
import type { Expense } from "@/Models/Expense";
import type { PlannedOccurrence, PlannedTransaction } from "@/Models/PlannedTransaction";

const TODAY = "2026-07-27";

function expense(date: string, amount: number, title = "Something"): Expense {
  return {
    id: `${title}-${date}`,
    title,
    amount,
    date,
    description: "",
    accountId: "a1",
    categoryId: "c1",
  };
}

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: "a1",
    name: "Main Checking",
    amountType: AmountType.CheckingAccount,
    balance: 1000,
    reservedAmount: 0,
    currencyId: "cur1",
    currencyCode: "EUR",
    description: "",
    ...overrides,
  };
}

/** An occurrence waiting to be confirmed — something genuinely owed now. */
function occurrence(
  dueDate: string,
  amount: number,
  title = "Bill",
  kind: PlannedKind = PlannedKind.Expense,
): PlannedOccurrence {
  return {
    id: `${title}-${dueDate}`,
    plannedTransactionId: `t-${title}`,
    periodKey: dueDate.slice(0, 7),
    dueDate,
    state: PlannedOccurrenceState.Pending,
    committedAt: null,
    expenseId: null,
    incomeId: null,
    transferId: null,
    title,
    description: null,
    kind,
    amount,
    categoryId: "c1",
    fromAccountId: "a1",
    toAccountId: null,
    savingGoalId: null,
  };
}

/** A schedule contributing its computed next date — a look-ahead, not yet owed. */
function plan(
  nextDueDate: string | null,
  amount: number,
  title = "Plan",
  overrides: Partial<PlannedTransaction> = {},
): PlannedTransaction {
  return {
    id: `t-${title}`,
    title,
    amount,
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
    nextDueDate,
    pendingCount: 0,
    ...overrides,
  };
}

describe("date helpers", () => {
  it("shifts days across a month boundary", () => {
    expect(addDaysISO("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysISO("2026-08-01", -1)).toBe("2026-07-31");
  });

  it("counts whole days between dates in both directions", () => {
    expect(daysBetween("2026-07-27", "2026-08-01")).toBe(5);
    expect(daysBetween("2026-07-27", "2026-07-27")).toBe(0);
    expect(daysBetween("2026-07-27", "2026-07-20")).toBe(-7);
  });

  it("knows month lengths, leap years included", () => {
    expect(daysInMonth("2026-07")).toBe(31);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
  });
});

describe("monthCursor", () => {
  it("counts today as a day still left to spend", () => {
    // 27 July of a 31-day month: 27th, 28th … 31st = 5 days.
    const cursor = monthCursor("2026-07", TODAY);
    expect(cursor.daysInMonth).toBe(31);
    expect(cursor.dayReached).toBe(27);
    expect(cursor.daysLeft).toBe(5);
    expect(cursor.elapsed).toBeCloseTo(27 / 31, 5);
  });

  it("treats a past month as fully elapsed", () => {
    const cursor = monthCursor("2026-06", TODAY);
    expect(cursor.dayReached).toBe(30);
    expect(cursor.daysLeft).toBe(0);
    expect(cursor.elapsed).toBe(1);
  });

  it("treats a future month as untouched", () => {
    const cursor = monthCursor("2026-08", TODAY);
    expect(cursor.dayReached).toBe(0);
    expect(cursor.daysLeft).toBe(31);
    expect(cursor.elapsed).toBe(0);
  });
});

describe("buildSpendCalendar", () => {
  const expenses = [
    expense("2026-07-01", 1150),
    expense("2026-07-05", 20),
    expense("2026-07-05", 48),
    expense("2026-07-27", 3.2),
    expense("2026-06-30", 999), // other month — ignored
  ];

  it("pads the grid so the 1st lands on its weekday, Monday first", () => {
    // 1 July 2026 is a Wednesday → Mon, Tue blank.
    const { cells } = buildSpendCalendar(expenses, "2026-07", TODAY);
    expect(cells.slice(0, 2).every((c) => c.kind === "blank")).toBe(true);
    expect(cells[2]).toMatchObject({ kind: "day", day: 1 });
    expect(cells.filter((c) => c.kind === "day")).toHaveLength(31);
  });

  it("sums the day's expenses and ignores other months", () => {
    const { cells, max, busiestDay } = buildSpendCalendar(expenses, "2026-07", TODAY);
    const days = cells.filter((c) => c.kind === "day");
    expect(days.find((d) => d.kind === "day" && d.day === 5)).toMatchObject({ amount: 68 });
    expect(max).toBe(1150);
    expect(busiestDay).toBe(1);
  });

  it("bands by quartile, so one huge day does not flatten the rest", () => {
    // Spending days are 3.20, 68 and 1150. Under a max-relative scale the two
    // smaller days would both collapse into the palest band.
    const { cells, scaleTop } = buildSpendCalendar(expenses, "2026-07", TODAY);
    const byDay = (day: number) =>
      cells.find((c) => c.kind === "day" && c.day === day) as Extract<
        (typeof cells)[number],
        { kind: "day" }
      >;
    expect(byDay(1).level).toBe(4);
    expect(byDay(5).level).toBe(3);
    expect(byDay(27).level).toBe(2);
    expect(byDay(2).level).toBe(0); // nothing logged
    expect(scaleTop).toBe(1150);
  });

  it("gives a lone spending day the darkest band rather than the palest", () => {
    const { cells } = buildSpendCalendar([expense("2026-07-09", 40)], "2026-07", TODAY);
    const day = cells.find((c) => c.kind === "day" && c.day === 9) as Extract<
      (typeof cells)[number],
      { kind: "day" }
    >;
    expect(day.level).toBe(4);
  });

  it("marks today and the days still to come", () => {
    const { cells, spentDays, quietDays } = buildSpendCalendar(expenses, "2026-07", TODAY);
    const byDay = (day: number) =>
      cells.find((c) => c.kind === "day" && c.day === day) as Extract<
        (typeof cells)[number],
        { kind: "day" }
      >;
    expect(byDay(27).isToday).toBe(true);
    expect(byDay(27).isFuture).toBe(false);
    expect(byDay(28).isFuture).toBe(true);
    // 1, 5 and 27 have spend; the other 24 days reached are quiet.
    expect(spentDays).toBe(3);
    expect(quietDays).toBe(24);
  });

  it("survives a month with nothing logged", () => {
    const { cells, max, scaleTop, busiestDay, spentDays } = buildSpendCalendar(
      [],
      "2026-07",
      TODAY,
    );
    expect(max).toBe(0);
    expect(scaleTop).toBe(0);
    expect(busiestDay).toBeNull();
    expect(spentDays).toBe(0);
    expect(cells.every((c) => c.kind === "blank" || c.level === 0)).toBe(true);
  });
});

describe("liquidPosition", () => {
  const identity = (amount: number) => amount;

  it("counts only what you can spend from", () => {
    const accounts = [
      account({ id: "1", amountType: AmountType.CheckingAccount, balance: 2000 }),
      account({ id: "2", amountType: AmountType.Cash, balance: 137 }),
      account({ id: "3", amountType: AmountType.SavingsAccount, balance: 800 }),
      account({ id: "4", amountType: AmountType.CreditCard, balance: -450 }),
      account({ id: "5", amountType: AmountType.Investment, balance: 5000 }),
    ];
    const position = liquidPosition(accounts, identity);
    expect(position.total).toBe(2937);
    expect(position.liquidCount).toBe(3);
    expect(position.accountCount).toBe(5);
  });

  it("converts each balance out of its own currency", () => {
    const accounts = [
      account({ id: "1", balance: 100, currencyCode: "EUR" }),
      account({ id: "2", balance: 100, currencyCode: "USD", amountType: AmountType.Cash }),
    ];
    const convert = (amount: number, code: string) => (code === "USD" ? amount / 2 : amount);
    expect(liquidPosition(accounts, convert).total).toBe(150);
  });

  // The promise made when envelopes landed: the overwhelming majority of users
  // have no savings goals, and for them not one figure on the dashboard may
  // move. Same accounts as the first test, stated again with the field present
  // and zero, so a regression in the subtraction shows up here first.
  it("is unchanged for a user with no goals", () => {
    const accounts = [
      account({ id: "1", amountType: AmountType.CheckingAccount, balance: 2000, reservedAmount: 0 }),
      account({ id: "2", amountType: AmountType.Cash, balance: 137, reservedAmount: 0 }),
      account({ id: "3", amountType: AmountType.SavingsAccount, balance: 800, reservedAmount: 0 }),
      account({ id: "4", amountType: AmountType.CreditCard, balance: -450, reservedAmount: 0 }),
      account({ id: "5", amountType: AmountType.Investment, balance: 5000, reservedAmount: 0 }),
    ];
    const position = liquidPosition(accounts, identity);
    expect(position.total).toBe(2937);
    expect(position.reserved).toBe(0);
    expect(position.liquidCount).toBe(3);
    expect(position.accountCount).toBe(5);
    expect(cashRunwayDays(position.total, 60)).toBe(48);
  });

  it("treats an account payload with no reserved field as nothing reserved", () => {
    // What an offline cache written before envelopes existed looks like.
    const stale = { ...account({ balance: 500 }) } as Partial<Account> & Account;
    delete (stale as { reservedAmount?: number }).reservedAmount;
    expect(usableBalance(stale)).toBe(500);
    expect(liquidPosition([stale], identity)).toMatchObject({ total: 500, reserved: 0 });
  });

  it("leaves reserved money out of the usable total and reports it separately", () => {
    const accounts = [
      account({ id: "1", balance: 2000, reservedAmount: 500 }),
      account({ id: "2", amountType: AmountType.Cash, balance: 137, reservedAmount: 37 }),
      // Reserved on an account you cannot spend from is nobody's business here.
      account({ id: "3", amountType: AmountType.Investment, balance: 5000, reservedAmount: 900 }),
    ];
    const position = liquidPosition(accounts, identity);
    expect(position.total).toBe(1600);
    expect(position.reserved).toBe(537);
    expect(position.liquidCount).toBe(2);
  });

  it("shortens the runway by what the goals hold back", () => {
    const accounts = [account({ balance: 3000, reservedAmount: 1200 })];
    const { total } = liquidPosition(accounts, identity);
    // 1800 usable at 60/day, not 3000 — the reserved 1200 is spoken for.
    expect(cashRunwayDays(total, 60)).toBe(30);
  });

  it("lets an over-reserved account go negative rather than clamping it", () => {
    // Contributing more than the account holds is allowed — warn, never block —
    // so the shortfall has to eat into the rest of the position, not vanish.
    const accounts = [
      account({ id: "1", balance: 100, reservedAmount: 400 }),
      account({ id: "2", amountType: AmountType.Cash, balance: 500, reservedAmount: 0 }),
    ];
    expect(usableBalance(accounts[0])).toBe(-300);
    expect(liquidPosition(accounts, identity).total).toBe(200);
  });

  it("subtracts reserved before converting, in the account's own currency", () => {
    // 100 USD reserved is 50 EUR of usable money lost, not 100. Netting the two
    // converted totals afterwards would come to the same figure only by luck.
    const accounts = [
      account({ id: "1", balance: 100, currencyCode: "EUR", reservedAmount: 40 }),
      account({
        id: "2",
        balance: 300,
        currencyCode: "USD",
        amountType: AmountType.Cash,
        reservedAmount: 100,
      }),
    ];
    const convert = (amount: number, code: string) => (code === "USD" ? amount / 2 : amount);
    const position = liquidPosition(accounts, convert);
    expect(position.total).toBe(160);
    expect(position.reserved).toBe(90);
  });
});

describe("dailyBurn", () => {
  it("divides by the window once history covers it", () => {
    // One €90 expense on every day of the 90-day window.
    const expenses = Array.from({ length: 90 }, (_, i) => expense(addDaysISO(TODAY, -i), 90));
    expect(dailyBurn(expenses, TODAY, 90)).toBeCloseTo(90, 5);
  });

  it("divides by the days actually covered when history is short", () => {
    // €300 over 3 days is €100/day, not €300/90.
    const expenses = [
      expense(TODAY, 100),
      expense(addDaysISO(TODAY, -1), 100),
      expense(addDaysISO(TODAY, -2), 100),
    ];
    expect(dailyBurn(expenses, TODAY, 90)).toBeCloseTo(100, 5);
  });

  it("ignores expenses outside the window and in the future", () => {
    const expenses = [
      expense(addDaysISO(TODAY, -200), 5000),
      expense(addDaysISO(TODAY, 5), 5000),
      expense(TODAY, 50),
    ];
    expect(dailyBurn(expenses, TODAY, 90)).toBeCloseTo(50, 5);
  });

  it("is zero with no history", () => {
    expect(dailyBurn([], TODAY)).toBe(0);
  });
});

/**
 * A split bill on an expense named `expected`, of which `settled` has come
 * back. The gross stays on `amount` — that is what left the account.
 */
function split(
  date: string,
  amount: number,
  expected: number,
  settled = 0,
  title = "Dinner",
): Expense {
  return {
    ...expense(date, amount, title),
    expectedReimbursement: expected,
    settledReimbursement: settled,
    openReimbursement: expected - settled,
  };
}

describe("dailyBurn nets out what others owe", () => {
  // The regression pin, and the point of it: the burn rate feeds the runway,
  // which is a number people plan around. Nothing about a history without a
  // single split bill may move by a cent.
  it("is unchanged to the cent for a history with no splits", () => {
    const history = [
      expense(TODAY, 12.34),
      expense(addDaysISO(TODAY, -1), 7.5),
      expense(addDaysISO(TODAY, -9), 100),
    ];
    // 119.84 over the 10 days the history covers — what it returned before
    // reimbursements existed.
    expect(dailyBurn(history, TODAY, 90)).toBeCloseTo(11.984, 10);
  });

  it("treats an absent, null or zero receivable as no receivable at all", () => {
    const plain = expense(TODAY, 60);
    expect(dailyBurn([plain], TODAY, 90)).toBe(60);
    expect(dailyBurn([{ ...plain, expectedReimbursement: null }], TODAY, 90)).toBe(60);
    expect(dailyBurn([{ ...plain, expectedReimbursement: undefined }], TODAY, 90)).toBe(60);
    expect(dailyBurn([{ ...plain, expectedReimbursement: 0 }], TODAY, 90)).toBe(60);
  });

  it("counts only your own share of a split bill", () => {
    // A 60 dinner with 40 coming back is 20 of your spending, not 60.
    expect(dailyBurn([split(TODAY, 60, 40)], TODAY, 90)).toBeCloseTo(20, 10);
  });

  it("does not change once the receivable is settled", () => {
    // Settling moves money, not history: the burn nets the expectation, so
    // being paid back must not retroactively lower a past day's spending.
    expect(dailyBurn([split(TODAY, 60, 40, 40)], TODAY, 90)).toBeCloseTo(20, 10);
  });

  it("mixes split and unsplit history without disturbing either", () => {
    const history = [expense(TODAY, 30), split(addDaysISO(TODAY, -1), 60, 40)];
    // 30 of groceries plus 20 of dinner over the two days covered.
    expect(dailyBurn(history, TODAY, 90)).toBeCloseTo(25, 10);
  });
});

describe("owedToMe", () => {
  it("is zero without a single split bill", () => {
    expect(owedToMe([expense(TODAY, 60), expense(addDaysISO(TODAY, -3), 12)])).toBe(0);
    expect(owedToMe([])).toBe(0);
  });

  it("sums what is still open rather than what was expected", () => {
    expect(owedToMe([split(TODAY, 60, 40, 15), split(TODAY, 120, 100, 0, "Tickets")])).toBe(125);
  });

  it("has no window — an old debt is still a debt", () => {
    // Deliberately outside the 90-day burn window.
    expect(owedToMe([split(addDaysISO(TODAY, -400), 50, 25)])).toBe(25);
  });

  it("falls back to the expectation on a row the server has not answered for", () => {
    // A queued offline split has no settlements by definition, so the whole
    // expectation is open.
    const queued: Expense = { ...expense(TODAY, 60), expectedReimbursement: 40 };
    expect(owedToMe([queued])).toBe(40);
  });

  it("drops out once everything has come back", () => {
    expect(owedToMe([split(TODAY, 60, 40, 40)])).toBe(0);
  });
});

describe("frontedThisMonth", () => {
  it("is zero without a single split bill", () => {
    expect(frontedThisMonth([expense(TODAY, 60)], TODAY)).toBe(0);
  });

  it("counts the whole expectation, settled or not", () => {
    // What you carried this month is the question, not what is left of it.
    expect(frontedThisMonth([split(TODAY, 60, 40, 40)], TODAY)).toBe(40);
  });

  it("dates at the expense, never at the payback", () => {
    const lastMonth = split("2026-06-20", 100, 80);
    const thisMonth = split("2026-07-02", 60, 40);
    expect(frontedThisMonth([lastMonth, thisMonth], TODAY)).toBe(40);
  });

  it("counts a whole month, including days still to come", () => {
    expect(frontedThisMonth([split("2026-07-31", 50, 25)], TODAY)).toBe(25);
  });
});

describe("cashRunwayDays", () => {
  it("floors to whole days", () => {
    expect(cashRunwayDays(2937, 60)).toBe(48);
  });

  it("is unknowable without a burn rate or a balance", () => {
    expect(cashRunwayDays(2937, 0)).toBeNull();
    expect(cashRunwayDays(0, 60)).toBeNull();
    expect(cashRunwayDays(-100, 60)).toBeNull();
  });
});

describe("upcomingBills", () => {
  // Only the overdue one has actually fallen due, so only it exists as an
  // occurrence; the rest are look-ahead dates computed from their schedules.
  const queue = [occurrence("2026-07-20", 15, "Overdue thing")];
  const plans = [
    plan("2026-08-10", 29, "Gym"),
    plan("2026-07-29", 412, "Car insurance"),
    plan("2026-08-01", 1150, "Rent"),
  ];

  it("sorts soonest first, overdue leading", () => {
    const sorted = upcomingBills(queue, plans, TODAY);
    expect(sorted.map((b) => b.title)).toEqual(["Overdue thing", "Car insurance", "Rent", "Gym"]);
    expect(sorted[0].daysUntil).toBe(-7);
    expect(sorted[1].daysUntil).toBe(2);
  });

  it("marks only what has fallen due as confirmable", () => {
    const sorted = upcomingBills(queue, plans, TODAY);
    // The widget's confirm button hangs off this: a date that has not arrived
    // has no occurrence behind it and nothing to post.
    expect(sorted[0].occurrence).not.toBeNull();
    expect(sorted.slice(1).every((b) => b.occurrence === null)).toBe(true);
  });

  it("does not list a schedule twice when its next date is already queued", () => {
    const alsoQueued = occurrence("2026-07-29", 412, "Car insurance");
    alsoQueued.plannedTransactionId = "t-Car insurance";

    const sorted = upcomingBills([...queue, alsoQueued], plans, TODAY);

    expect(sorted.filter((b) => b.title === "Car insurance")).toHaveLength(1);
    // The real one wins, because it is the one you can act on.
    expect(sorted.find((b) => b.title === "Car insurance")?.occurrence).not.toBeNull();
  });

  it("ignores paused schedules and ones with nothing further scheduled", () => {
    const sorted = upcomingBills(
      [],
      [plan("2026-08-01", 100, "Paused", { isActive: false }), plan(null, 100, "Finished")],
      TODAY,
    );

    expect(sorted).toEqual([]);
  });

  it("sums what falls inside the horizon", () => {
    const sorted = upcomingBills(queue, plans, TODAY);
    // Overdue (15) + car insurance (412) + rent (1150) within 5 days; gym is 14 out.
    expect(billsDueWithin(sorted, 5)).toBe(1577);
    expect(billsDueWithin(sorted, 14)).toBe(1606);
  });

  it("leaves money coming in out of the total", () => {
    // "What do I need to cover?" — netting a salary against it would flatter the
    // figure into uselessness.
    const withSalary = upcomingBills(
      [occurrence("2026-07-28", 2500, "Salary", PlannedKind.Income), ...queue],
      [],
      TODAY,
    );

    expect(billsDueWithin(withSalary, 5)).toBe(15);
  });
});

describe("detectRecurring", () => {
  /** A charge on the same day-of-month for `count` months back from July 2026. */
  function monthly(title: string, amount: number, day: number, count: number): Expense[] {
    return Array.from({ length: count }, (_, i) =>
      expense(`2026-${String(7 - i).padStart(2, "0")}-${String(day).padStart(2, "0")}`, amount, title),
    );
  }

  it("finds a monthly subscription and projects the next charge", () => {
    const charges = detectRecurring(monthly("Spotify Premium", 10.99, 4, 4), TODAY);
    expect(charges).toHaveLength(1);
    expect(charges[0]).toMatchObject({
      name: "Spotify Premium",
      amount: 10.99,
      occurrences: 4,
      lastDate: "2026-07-04",
    });
    // Last charge was 4 July; the next projection must not be in the past.
    expect(charges[0].nextDate >= TODAY).toBe(true);
  });

  it("ignores anything seen fewer than three times", () => {
    expect(detectRecurring(monthly("Twice only", 20, 3, 2), TODAY)).toEqual([]);
  });

  it("ignores same-month bursts that are not a monthly cadence", () => {
    const coffee = [
      expense("2026-07-01", 3.2, "Flat white"),
      expense("2026-07-08", 3.2, "Flat white"),
      expense("2026-07-15", 3.2, "Flat white"),
      expense("2026-07-22", 3.2, "Flat white"),
    ];
    expect(detectRecurring(coffee, TODAY)).toEqual([]);
  });

  it("ignores a repeated title whose amount swings wildly", () => {
    const groceries = [
      expense("2026-05-06", 20, "Lidl"),
      expense("2026-06-06", 68, "Lidl"),
      expense("2026-07-06", 140, "Lidl"),
    ];
    expect(detectRecurring(groceries, TODAY)).toEqual([]);
  });

  it("groups titles case-insensitively and totals the monthly cost", () => {
    const charges = detectRecurring(
      [
        expense("2026-05-10", 29, "Gym membership"),
        expense("2026-06-10", 29, "GYM MEMBERSHIP"),
        expense("2026-07-10", 29, "gym Membership"),
        ...monthly("Mobile plan", 18.5, 12, 3),
      ],
      TODAY,
    );
    expect(charges).toHaveLength(2);
    expect(charges.map((c) => c.occurrences).sort()).toEqual([3, 3]);
    expect(recurringMonthlyTotal(charges)).toBeCloseTo(47.5, 5);
  });

  it("orders by the next charge date", () => {
    const charges = detectRecurring(
      [...monthly("Late one", 5, 26, 3), ...monthly("Early one", 5, 2, 4)],
      TODAY,
    );
    expect(charges.map((c) => c.name)).toEqual(["Early one", "Late one"]);
  });
});

describe("splitAmountParts", () => {
  it("peels the cents off a symbol-first format", () => {
    expect(splitAmountParts("€1,234.56")).toEqual({
      lead: "€1,234",
      fraction: ".56",
      trail: "",
    });
  });

  it("keeps a trailing symbol out of the dimmed fraction", () => {
    expect(splitAmountParts("1.234,56 €")).toEqual({
      lead: "1.234",
      fraction: ",56",
      trail: " €",
    });
  });

  it("leaves a whole-number format alone", () => {
    expect(splitAmountParts("¥1,234")).toEqual({ lead: "¥1,234", fraction: "", trail: "" });
  });
});

describe("greeting", () => {
  it("tracks the time of day", () => {
    expect(greeting(new Date(2026, 6, 27, 8))).toBe("Good morning");
    expect(greeting(new Date(2026, 6, 27, 14))).toBe("Good afternoon");
    expect(greeting(new Date(2026, 6, 27, 21))).toBe("Good evening");
  });
});
