import React, { useState } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import { DollarSign, Calendar, FileText } from "lucide-react"
import type { SavingContributions } from "@/Models/SavingGoals"

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
  const [date, setDate] = useState(new Date())
  const [note, setNote] = useState("")

  const toNumber = (v: string) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  const toDate = (v: string) => new Date(`${v}T00:00:00`)
  const toDateInput = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

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
    setDate(new Date())
    setNote("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            Add Contribution to{" "}
            <span className="text-green-600 dark:text-green-400">{goalTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="contrib-amount" className="text-sm font-medium text-foreground">
              Amount
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contrib-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(toNumber(e.target.value))}
                placeholder="500.00"
                className="pl-10 h-11 border-border bg-background"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="contrib-date" className="text-sm font-medium text-foreground">
              Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="contrib-date"
                type="date"
                value={toDateInput(date)}
                onChange={(e) => setDate(toDate(e.target.value))}
                className="pl-10 h-11 border-border bg-background"
                required
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Note
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Monthly deposit"
                className="pl-10 min-h-16 resize-none border-border bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6 h-11 border-border hover:bg-muted bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 h-11 bg-green-600 text-white hover:bg-green-700"
            >
              Add Contribution
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
