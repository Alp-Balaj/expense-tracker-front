import React, { useEffect, useMemo, useState } from "react";
import { Receipt, Wallet } from "lucide-react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker";
import { DateField } from "@/Components/Forms/shared/DateField";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { PotAttributionField } from "@/Components/Pots/PotAttributionField";
import { useAccountsQuery } from "@/Hooks/queries/useAccounts";
import { currencySymbol } from "@/lib/identity";
import { todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { CreatePotExpense, PotExpenseShareInput, PotMember } from "@/Models/Pot";

export interface PotExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: PotMember[];
  currencyCode: string;
  onSubmit: (expense: CreatePotExpense) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Something the group spent money on, and who it was for.
 *
 * <h3>Two questions, in the order they are answered</h3>
 * How much, then who for. The attribution picker sits directly under the amount
 * so the slices move as the total is typed — which is what makes "tap a person
 * to type an exact amount, remainder redistributes" something you can see
 * rather than something you have to be told.
 *
 * <h3>The pot paid, unless you say you did</h3>
 * Paying from the pot is the default because it is the ordinary case. The
 * "I paid for this myself" option books a contribution and a consumption in one
 * gesture — the account really is debited — and it is the only reason this form
 * asks about an account at all.
 *
 * There is deliberately no way to record that somebody *else* fronted it.
 * Attribution is free (anyone may say an expense was for anyone) but funding is
 * not: recording it moves a real account balance, and no user writes into an
 * account they do not own.
 */
export default function PotExpenseModal({
  open,
  onOpenChange,
  members,
  currencyCode,
  onSubmit,
  onCancel,
}: PotExpenseModalProps) {
  const { data: accounts = [] } = useAccountsQuery();

  const blank = useMemo(
    () => ({ title: "", amount: 0, date: todayISO(), description: "" }),
    [],
  );

  const [data, setData] = useState(blank);
  const [shares, setShares] = useState<PotExpenseShareInput[]>([]);
  const [splitUsable, setSplitUsable] = useState(true);
  const [outOfPocket, setOutOfPocket] = useState(false);
  const [accountId, setAccountId] = useState("");

  // The picker rebuilds its own state from `members` on every open, so the
  // reset here is only for this form's own fields.
  useEffect(() => {
    if (!open) return;
    setData(blank);
    setOutOfPocket(false);
    setAccountId(accounts[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, blank]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await onSubmit({
        title: data.title.trim(),
        description: data.description.trim() || null,
        amount: data.amount,
        date: data.date,
        paidFromAccountId: outOfPocket ? accountId : null,
        shares,
      });
    } catch {
      return; // the caller shows the toast; keep the form open so nothing is retyped
    }

    onOpenChange(false);
  };

  const canSubmit =
    data.title.trim().length > 0 &&
    data.amount > 0 &&
    splitUsable &&
    shares.length > 0 &&
    (!outOfPocket || accountId.length > 0);

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title="Shared expense"
      description="What the group spent, and who it was for."
      submitLabel="Log expense"
      submitDisabled={!canSubmit}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[560px]"
    >
      <AmountField
        id="pot-expense-amount"
        label="How much?"
        value={data.amount}
        onChange={(amount) => setData({ ...data, amount })}
        currencySymbol={currencySymbol(currencyCode)}
        autoFocus
      />

      <div className="space-y-2">
        <Label htmlFor="pot-expense-title" className="text-sm font-medium text-foreground">
          What was it?
        </Label>
        <div className="relative">
          <Receipt className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pot-expense-title"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="e.g. The big shop, Friday dinner"
            className="h-11 border-border bg-background pl-10"
            maxLength={100}
            required
          />
        </div>
      </div>

      <PotAttributionField
        members={members}
        amount={data.amount}
        currencyCode={currencyCode}
        onChange={setShares}
        onValidityChange={(usable) => setSplitUsable(usable)}
      />

      <DateField
        label="When?"
        value={data.date}
        onChange={(date) => setData({ ...data, date })}
      />

      {/* Who paid — the pot, or you. Collapsed to one chip until it is needed,
          because the pot paying is the ordinary case. */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Paid with</Label>

        <div role="radiogroup" aria-label="Paid with" className="flex flex-wrap gap-2">
          {[
            { id: "pot", label: "The pot" },
            { id: "me", label: "I paid for this myself" },
          ].map((option) => {
            const selected = (option.id === "me") === outOfPocket;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setOutOfPocket(option.id === "me")}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/15 font-medium text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted",
                )}
              >
                {option.id === "me" && <Wallet aria-hidden className="h-3.5 w-3.5" />}
                {option.label}
              </button>
            );
          })}
        </div>

        {outOfPocket ? (
          <div className="space-y-2 pt-1">
            <ChipPicker
              label="From which account?"
              items={accounts.map((a) => ({ id: a.id, label: a.name }))}
              value={accountId}
              onChange={setAccountId}
              emptyHint="You need an account before you can pay for something yourself."
            />
            <p className="text-xs text-muted-foreground">
              This account is debited in full, and the pot's balance does not move — you
              fronted the money, so the group owes it back to you. Nobody else sees which
              account it was.
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Comes out of the pot's balance.
          </p>
        )}
      </div>
    </FormShell>
  );
}
