import React, { useState } from "react"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import { FormShell } from "@/Components/Forms/shared/FormShell"
import { AmountField } from "@/Components/Forms/shared/AmountField"
import { DateField } from "@/Components/Forms/shared/DateField"
import type { SavingContributions } from "@/Models/SavingGoals"
import { todayISO } from "@/lib/dates"

interface SavingsContributionModalProps {
  goalId: string
  goalTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (contribution: SavingContributions) => void
}

export default function SavingContributionsModal({
  goalId,
  goalTitle,
  open,
  onOpenChange,
  onSubmit,
}: SavingsContributionModalProps) {
  const [amount, setAmount] = useState(0)
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const contribution: SavingContributions = {
      id: crypto.randomUUID(),
      goalId,
      amount,
      date,
      note,
    }
    onSubmit(contribution)
    setAmount(0)
    setDate(todayISO())
    setNote("")
    onOpenChange(false)
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={`Add Contribution to ${goalTitle}`}
      submitLabel="Add Contribution"
      onSubmit={handleSubmit}
      // The old amount input enforced required/min="0.01"; AmountField can't,
      // so the gate moved to the submit button.
      submitDisabled={amount <= 0}
      desktopClassName="sm:max-w-[420px]"
    >
      <AmountField value={amount} onChange={setAmount} autoFocus />

      <DateField value={date} onChange={setDate} />

      <div className="space-y-2">
        <Label htmlFor="contrib-note" className="text-sm font-medium">
          Note
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        </Label>
        <Textarea
          id="contrib-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Monthly deposit"
          className="min-h-16 resize-none"
        />
      </div>
    </FormShell>
  )
}
