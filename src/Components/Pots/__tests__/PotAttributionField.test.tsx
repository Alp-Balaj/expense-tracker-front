import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PotAttributionField } from "@/Components/Pots/PotAttributionField";
import type { PotExpenseShareInput, PotMember } from "@/Models/Pot";

/**
 * The attribution picker, driven the way a person drives it.
 *
 * The charter specifies this interaction in one sentence — "pick who an expense
 * applies to → split evenly by default → tap any person to type an exact
 * amount, remainder redistributes across the rest" — and every clause of it is
 * a separate thing that can break. What is asserted here is both halves: the
 * slices the user *sees*, and the payload the form *sends*, which are
 * deliberately not the same thing.
 */

function member(id: string, displayName: string, isYou = false): PotMember {
  return {
    id,
    displayName,
    joinedAt: "2026-08-04T10:00:00Z",
    leftAt: null,
    isActive: true,
    isAnonymized: false,
    isYou,
  };
}

// In join order, which is the rounding tie-break — the component must not
// re-sort them, and this order is what makes the extra cent predictable.
const MEMBERS = [
  member("mem-1", "AlpBalaj", true),
  member("mem-2", "MaraIonescu"),
  member("mem-3", "TomasNovak"),
];

function renderField(amount: number) {
  const onChange = vi.fn<[PotExpenseShareInput[]], void>();

  render(
    <PotAttributionField
      members={MEMBERS}
      amount={amount}
      currencyCode="EUR"
      onChange={onChange}
    />,
  );

  return { onChange, latest: () => onChange.mock.lastCall?.[0] ?? [] };
}

describe("PotAttributionField", () => {
  it("starts with everyone selected and the bill split evenly", () => {
    const { latest } = renderField(10);

    expect(screen.getByText("Everyone, split evenly")).toBeInTheDocument();

    // 10.00 across three: the leftover cent to the earliest-joined member.
    expect(screen.getByRole("button", { name: /Type an exact amount for AlpBalaj/ })).toHaveTextContent(
      "€3.34",
    );
    expect(
      screen.getByRole("button", { name: /Type an exact amount for MaraIonescu/ }),
    ).toHaveTextContent("€3.33");

    // And every slice is sent as null, not as the previewed number — the
    // server divides the remainder itself, so the split follows the total
    // rather than freezing at whatever it was when the picker last rendered.
    expect(latest()).toEqual([
      { membershipId: "mem-1", amount: null },
      { membershipId: "mem-2", amount: null },
      { membershipId: "mem-3", amount: null },
    ]);
  });

  it("drops somebody when their name is tapped, and re-splits across the rest", async () => {
    const user = userEvent.setup();
    const { latest } = renderField(10);

    await user.click(screen.getByRole("checkbox", { name: /TomasNovak/ }));

    expect(screen.getByText("2 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Type an exact amount for AlpBalaj/ })).toHaveTextContent(
      "€5.00",
    );

    expect(latest()).toEqual([
      { membershipId: "mem-1", amount: null },
      { membershipId: "mem-2", amount: null },
    ]);
  });

  it("pins one share when its amount is tapped, and the rest take what is left", async () => {
    const user = userEvent.setup();
    const { latest } = renderField(30);

    await user.click(screen.getByRole("button", { name: /Type an exact amount for MaraIonescu/ }));

    const field = screen.getByRole("textbox", { name: "MaraIonescu's share" });
    await user.clear(field);
    await user.type(field, "12");

    // The remainder redistributes live across the other two — 18 across two.
    expect(screen.getByRole("button", { name: /Type an exact amount for AlpBalaj/ })).toHaveTextContent(
      "€9.00",
    );
    expect(screen.getByRole("button", { name: /Type an exact amount for TomasNovak/ })).toHaveTextContent(
      "€9.00",
    );

    // Only the pinned one is sent as a number. That distinction is what lets
    // the server go on owning the allocation.
    expect(latest()).toEqual([
      { membershipId: "mem-1", amount: null },
      { membershipId: "mem-2", amount: 12 },
      { membershipId: "mem-3", amount: null },
    ]);
  });

  it("refuses pinned amounts that add up to more than the bill, in the server's words", async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();

    render(
      <PotAttributionField
        members={MEMBERS.slice(0, 2)}
        amount={10}
        currencyCode="EUR"
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Type an exact amount for AlpBalaj/ }));
    const field = screen.getByRole("textbox", { name: "AlpBalaj's share" });
    await user.clear(field);
    await user.type(field, "11");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Those shares add up to more than the expense.",
    );
    expect(onValidityChange).toHaveBeenLastCalledWith(
      false,
      "Those shares add up to more than the expense.",
    );
  });

  it("treats an empty pinned field as mid-edit rather than as a wrong number", async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();

    render(
      <PotAttributionField
        members={MEMBERS}
        amount={10}
        currencyCode="EUR"
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Type an exact amount for AlpBalaj/ }));
    await user.clear(screen.getByRole("textbox", { name: "AlpBalaj's share" }));

    // Nothing typed yet is not "zero" and not "invalid" — it is unfinished, and
    // saying so is the difference between a helpful form and a nagging one.
    expect(onValidityChange).toHaveBeenLastCalledWith(false, "Finish typing the amounts you pinned.");
  });

  it("un-pins back to an even slice", async () => {
    const user = userEvent.setup();
    const { latest } = renderField(30);

    await user.click(screen.getByRole("button", { name: /Type an exact amount for MaraIonescu/ }));
    await user.click(screen.getByRole("button", { name: /Split MaraIonescu's share evenly again/ }));

    expect(screen.getByText("Everyone, split evenly")).toBeInTheDocument();
    expect(latest().every((s) => s.amount === null)).toBe(true);
  });

  it("says so when nobody is picked, rather than sending an empty split", async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();

    render(
      <PotAttributionField
        members={MEMBERS.slice(0, 1)}
        amount={10}
        currencyCode="EUR"
        onChange={vi.fn()}
        onValidityChange={onValidityChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /AlpBalaj/ }));

    // The server's own sentence, so the form and the endpoint cannot end up
    // disagreeing about what is wrong.
    expect(screen.getByRole("alert")).toHaveTextContent("Say who this expense was for.");
    expect(onValidityChange).toHaveBeenLastCalledWith(false, "Say who this expense was for.");
  });
});
