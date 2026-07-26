import { useEffect, useMemo, useState } from "react"
import type { AxiosError } from "axios"
import { DataTable } from "../General/DataTable"
import ExpenseForm from "../Forms/ExpenseForm"
import { buildExpenseColumns, type Expense } from "@/Models/Expense"
import { useCrudList } from "@/Hooks/useCrudLists"
import ConfirmDelete from "../General/ConfirmDelete"
import { useAuth } from "@/Authorization/AuthContext"
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi"
import type { Account } from "@/Models/Account"
import type { Category } from "@/Models/Category"
import { useCurrency } from "@/Hooks/useCurrency"

export default function ExpenseList() {
  const {
    items: expenses,
    open,
    setOpen,
    dialogOpen,
    setDialogOpen,
    editing,
    deleting,
    startCreate,
    startEdit,
    startDelete,
    closeForm,
    closeModal,
    submit,
    confirmDelete
  } = useCrudList<Expense>({ endpoint: "api/Expense" })

  const { accessToken, isAuthReady } = useAuth()
  const { getAllData } = useAuthorizationApi()
  const { format, userCurrencyCode } = useCurrency()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    if (!isAuthReady || !accessToken) return

    let cancelled = false

    ;(async () => {
      try {
        const [accs, cats] = await Promise.all([
          getAllData<Account[]>("api/Account"),
          getAllData<Category[]>("api/Category"),
        ])
        if (cancelled) return
        setAccounts(accs)
        setCategories(cats)
      } catch (e: unknown) {
        const err = e as AxiosError
        if (err.response?.status !== 401) console.error(err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthReady, accessToken, getAllData])

  const columns = useMemo(
    () =>
      buildExpenseColumns({
        onEdit: (row) => startEdit(row),
        onDelete: (row) => startDelete(row),
        accounts,
        categories,
        formatter: (value) => format(value, userCurrencyCode),
      }),
    [startEdit, accounts, categories, format, userCurrencyCode]
  )

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={expenses}
        enableGlobalSearch
        searchPlaceholder="Search expenses..."
        globalSearchKeys={["title", "description", "amount"]}
        toolbar={{
          addLabel: "Add Expense",
          onAdd: startCreate,
        }}
      />

      <ExpenseForm
        row={editing}
        onSubmit={submit}
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen)
          if (!isOpen) closeForm()
        }}
        onCancel={closeForm}
      />

      <ConfirmDelete
        open={dialogOpen}
        close={closeModal}
        onOpenChange={setDialogOpen}
        onConfirm={confirmDelete}
        title="Delete income?"
        description={`Delete "${deleting?.title}"? This action cannot be undone.`}
      />
    </div>
  )
}