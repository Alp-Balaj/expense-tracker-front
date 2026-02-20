import React, { useCallback, useMemo, useState } from "react"
import { Button } from "@/Components/ui/button"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { Textarea } from "@/Components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/Components/ui/dialog"
import {
  FileText,
  DollarSign,
  Calendar,
  Wallet,
  Tag,
  Target,
} from "lucide-react"

import type { SavingGoals, AddSavingsGoal } from "@/Models/SavingGoals"
import { useAuth } from "@/Authorization/AuthContext"
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi"
import type { Account } from "@/Models/Account"
import type { Category } from "@/Models/Category"
import type { AxiosError } from "axios"

export interface SavingsGoalFormModalProps {
  row?: SavingGoals | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddSavingsGoal) => void
  onCancel?: () => void
}

type FormState = {
  id: string | null
  title: string
  targetAmount: number
  savedAmount: number
  deadline: Date
  description: string
  accountId: string
  categoryId: string
}

export default function SavingsGoalFormModal({
  row,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
}: SavingsGoalFormModalProps) {
  const { accessToken, isAuthReady } = useAuth()
  const { getAllData } = useAuthorizationApi()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getAllData<Account[]>("api/Account")
      setAccounts(data)
    } catch (e: unknown) {
      const err = e as AxiosError
      if (err.response?.status !== 401) console.error(err)
    }
  }, [getAllData])

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getAllData<Category[]>("api/Category")
      setCategories(data)
    } catch (e: unknown) {
      const err = e as AxiosError
      if (err.response?.status !== 401) console.error(err)
    }
  }, [getAllData])

  const normalizeDate = (value: unknown) => {
    if (value instanceof Date) return value
    if (typeof value === "string" || typeof value === "number") {
      const d = new Date(value)
      return isNaN(d.getTime()) ? new Date() : d
    }
    return new Date()
  }

  const initial: FormState = useMemo(
    () => ({
      id: row?.id ?? null,
      title: row?.title ?? "",
      targetAmount: row?.targetAmount ?? 0,
      savedAmount: row?.savedAmount ?? 0,
      deadline: normalizeDate(row?.deadline ?? new Date()),
      description: row?.description ?? "",
      accountId: row?.accountId ?? "",
      categoryId: row?.categoryId ?? "",
    }),
    [row]
  )

  const [data, setData] = useState<FormState>(initial)

  React.useEffect(() => {
    setData(initial)
    if (!isAuthReady || !accessToken) return
    fetchCategories()
    fetchAccounts()
  }, [initial, isAuthReady, accessToken, fetchCategories, fetchAccounts])

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
    const payload: AddSavingsGoal = {
      id: data.id,
      title: data.title,
      targetAmount: data.targetAmount,
      savedAmount: data.savedAmount,
      deadline: data.deadline,
      description: data.description,
      accountId: data.accountId,
      categoryId: data.categoryId,
    }
    onSubmit(payload)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  // Filter for Savings categories (CategoryType.Savings = 2)
  const savingsCategories = categories.filter((c) => c.categoryType === 2)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {row ? "Edit Savings Goal" : "New Savings Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="goal-title" className="text-sm font-medium text-foreground">
              My goal is
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="goal-title"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="e.g., Emergency fund, Vacation"
                className="pl-10 h-11 border-border bg-background"
                required
              />
            </div>
          </div>

          {/* Target Amount + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal-target" className="text-sm font-medium text-foreground">
                Money goal
              </Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="goal-target"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.targetAmount || ""}
                  onChange={(e) =>
                    setData({ ...data, targetAmount: toNumber(e.target.value) })
                  }
                  placeholder="10,000.00"
                  className="pl-10 h-11 border-border bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal-deadline" className="text-sm font-medium text-foreground">
                Deadline
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="goal-deadline"
                  type="date"
                  value={toDateInput(data.deadline)}
                  onChange={(e) =>
                    setData({ ...data, deadline: toDate(e.target.value) })
                  }
                  className="pl-10 h-11 border-border bg-background"
                  required
                />
              </div>
            </div>
          </div>

          {/* Initial Saved Amount (only on create) */}
          {!row && (
            <div className="space-y-2">
              <Label htmlFor="goal-saved" className="text-sm font-medium text-foreground">
                Already saved
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="goal-saved"
                  type="number"
                  step="0.01"
                  min="0"
                  value={data.savedAmount || ""}
                  onChange={(e) =>
                    setData({ ...data, savedAmount: toNumber(e.target.value) })
                  }
                  placeholder="0.00"
                  className="pl-10 h-11 border-border bg-background"
                />
              </div>
            </div>
          )}

          {/* Account + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Account</Label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={data.accountId}
                  onValueChange={(v) => setData({ ...data, accountId: v })}
                >
                  <SelectTrigger className="pl-10 h-11 border-border bg-background">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Category</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={data.categoryId}
                  onValueChange={(v) => setData({ ...data, categoryId: v })}
                >
                  <SelectTrigger className="pl-10 h-11 border-border bg-background">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {savingsCategories.length > 0
                      ? savingsCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))
                      : categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Description
              <span className="text-muted-foreground font-normal ml-1">(optional)</span>
            </Label>
            <Textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Why is this goal important to you?"
              className="min-h-20 resize-none border-border bg-background"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-6 h-11 border-border hover:bg-muted bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-6 h-11 bg-green-600 text-white hover:bg-green-700"
            >
              {row ? "Update Goal" : "Save Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
