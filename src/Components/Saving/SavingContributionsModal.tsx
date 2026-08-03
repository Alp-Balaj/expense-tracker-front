import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import { FormShell } from "@/Components/Forms/shared/FormShell"
import { AmountField } from "@/Components/Forms/shared/AmountField"
import { ChipPicker } from "@/Components/Forms/shared/ChipPicker"
import { DateField } from "@/Components/Forms/shared/DateField"
import type { SavingContributions, SavingGoals } from "@/Models/SavingGoals"
import { useAccountsQuery } from "@/Hooks/queries/useAccounts"
import { currencySymbol } from "@/lib/identity"
import { normalizeCode } from "@/lib/exchangeRates"
import { todayISO, toISODate } from "@/lib/dates"

interface SavingsContributionModalProps {
  goal: SavingGoals
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (contribution: SavingContributions) => void | Promise<void>
}

/** Which way the money moves. The typed amount stays positive either way. */
type Direction = "add" | "release"

const DIRECTIONS = [
  { id: "add", label: "Add" },
  { id: "release", label: "Release" },
]

export default function SavingContributionsModal({
  goal,
  open,
  onOpenChange,
  onSubmit,
}: SavingsContributionModalProps) {
  const navigate = useNavigate()
  const { data: accounts = [] } = useAccountsQuery()

  const [direction, setDirection] = useState<Direction>("add")
  const [amount, setAmount] = useState(0)
  const [accountId, setAccountId] = useState("")
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState("")

  // A goal is denominated in the currency of its first contribution's account,
  // and the backend rejects anything else — so the picker never offers it. An
  // empty goal has no currency yet and may be funded from anywhere.
  const eligibleAccounts = useMemo(() => {
    const goalCurrency = normalizeCode(goal.currencyCode)
    if (!goalCurrency) return accounts
    return accounts.filter((a) => normalizeCode(a.currencyCode) === goalCurrency)
  }, [accounts, goal.currencyCode])

  // The account the goal was created against is only a suggestion now; when it
  // is gone (or was never set) the goal's own history is the better guess.
  const suggestedAccountId = useMemo(() => {
    const eligible = (id: string | null) => !!id && eligibleAccounts.some((a) => a.id === id)
    if (eligible(goal.accountId)) return goal.accountId as string

    const latest = [...(goal.contributions ?? [])]
      .sort((a, b) => toISODate(b.date).localeCompare(toISODate(a.date)))
      .find((c) => eligible(c.accountId))
    if (latest?.accountId) return latest.accountId

    return eligibleAccounts[0]?.id ?? ""
  }, [goal.accountId, goal.contributions, eligibleAccounts])

  // Reopening the dialog is a fresh entry: the previous amount and note are
  // never what the user means the second time round.
  useEffect(() => {
    setDirection("add")
    setAmount(0)
    setDate(todayISO())
    setNote("")
  }, [open])

  useEffect(() => {
    setAccountId(suggestedAccountId)
  }, [suggestedAccountId, open])

  const selectedAccount = eligibleAccounts.find((a) => a.id === accountId)
  const releasing = direction === "release"
  const hasAccounts = accounts.length > 0

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const contribution: SavingContributions = {
      id: crypto.randomUUID(),
      goalId: goal.id ?? "",
      // Signed on the wire: a release is the same row with the sign flipped.
      amount: releasing ? -amount : amount,
      date,
      note,
      accountId,
    }
    try {
      await onSubmit(contribution)
    } catch {
      return // error toast shown by the submit handler; keep the dialog open
    }
    onOpenChange(false)
  }

  const goToAccounts = () => {
    onOpenChange(false)
    navigate("/account")
  }

  return (
    <FormShell
      open={open}
      onOpenChange={onOpenChange}
      title={
        releasing
          ? `Release Money from ${goal.title}`
          : `Add Contribution to ${goal.title}`
      }
      submitLabel={releasing ? "Release Money" : "Add Contribution"}
      onSubmit={handleSubmit}
      // The old amount input enforced required/min="0.01"; AmountField can't,
      // so the gate moved to the submit button — joined by the account, which
      // the backend refuses a contribution without.
      submitDisabled={amount <= 0 || !accountId}
      desktopClassName="sm:max-w-[420px]"
    >
      {!hasAccounts ? (
        <p className="text-sm text-muted-foreground">
          Money is reserved against an account, and you don't have one yet.{" "}
          <button
            type="button"
            onClick={goToAccounts}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </button>{" "}
          first.
        </p>
      ) : (
        <>
          <ChipPicker
            label="Direction"
            items={DIRECTIONS}
            value={direction}
            // ChipPicker deselects on a second tap; money always moves one way
            // or the other, so an empty choice is ignored rather than stored.
            onChange={(id) => id && setDirection(id as Direction)}
          />

          <AmountField
            value={amount}
            onChange={setAmount}
            currencySymbol={currencySymbol(
              selectedAccount?.currencyCode ?? goal.currencyCode
            )}
            label={releasing ? "Release" : "Amount"}
            autoFocus
          />

          <ChipPicker
            label={releasing ? "Release from" : "Reserve against"}
            items={eligibleAccounts.map((a) => ({ id: a.id, label: a.name }))}
            value={accountId}
            onChange={(id) => id && setAccountId(id)}
            emptyHint={
              goal.currencyCode
                ? `This goal holds ${goal.currencyCode}. You have no ${goal.currencyCode} account to use — start a separate goal instead.`
                : "No accounts yet."
            }
          />

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
              placeholder={
                releasing ? "e.g., Spent on the flights" : "e.g., Monthly deposit"
              }
              className="min-h-16 resize-none"
            />
          </div>
        </>
      )}
    </FormShell>
  )
}
