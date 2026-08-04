import React, { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";

import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { FormShell } from "@/Components/Forms/shared/FormShell";
import { AmountField } from "@/Components/Forms/shared/AmountField";
import { currencySymbol } from "@/lib/identity";
import type { Pot } from "@/Models/Pot";

/** The cycle's pot currency. Fixed at creation — see the note by the field. */
const POT_CURRENCY = "EUR";
const DEFAULT_LOW_BALANCE = 50;

export interface PotFormModalProps {
  pot?: Pot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; lowBalanceThreshold: number }) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Create or rename a pot, on the same FormShell every other form in the app
 * uses — full-screen on a phone, centred dialog on a desktop.
 *
 * There is no currency picker, and that is the design rather than a gap: a
 * pot's currency is fixed when it is opened, because changing it later would
 * silently reinterpret every amount the group has recorded in it.
 */
export default function PotFormModal({
  pot,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: PotFormModalProps) {
  const initial = useMemo(
    () => ({
      name: pot?.name ?? "",
      lowBalanceThreshold: pot?.lowBalanceThreshold ?? DEFAULT_LOW_BALANCE,
    }),
    [pot],
  );

  const [data, setData] = useState(initial);

  useEffect(() => {
    setData(initial);
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit({ name: data.name.trim(), lowBalanceThreshold: data.lowBalanceThreshold });
    } catch {
      return; // the caller shows the toast; keep the form open so nothing is retyped
    }
    onOpenChange(false);
  };

  const currency = pot?.currencyCode ?? POT_CURRENCY;

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      onCancel={onCancel}
      title={pot ? "Edit pot" : "New pot"}
      description={
        pot
          ? "Any member can change these. Everyone sees the change in the activity log."
          : "A shared wallet for a household, a flat or a trip."
      }
      submitLabel={pot ? "Save changes" : "Create pot"}
      submitDisabled={data.name.trim().length === 0}
      onSubmit={handleSubmit}
      desktopClassName="sm:max-w-[520px]"
    >
      <div className="space-y-2">
        <Label htmlFor="pot-name" className="text-sm font-medium text-foreground">
          What is this pot for?
        </Label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pot-name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="e.g. The Flat, Ski trip"
            className="h-11 border-border bg-background pl-10"
            autoFocus={!pot}
            maxLength={100}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <AmountField
          id="pot-low-balance"
          label="Tell everyone when the pot drops below"
          value={data.lowBalanceThreshold}
          onChange={(lowBalanceThreshold) => setData({ ...data, lowBalanceThreshold })}
          currencySymbol={currencySymbol(currency)}
        />
        <p className="text-xs text-muted-foreground">
          Set it to zero to switch the warning off. Any member can change it later.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        This pot is in <span className="font-medium text-foreground">{currency}</span>. A pot's
        currency is fixed when it is created.
      </p>
    </FormShell>
  );
}
