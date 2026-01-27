import {
  textColumn,
  sortableColumn,
  currencyColumn,
  actionsColumn,
} from "@/Components/General/Columns"

export type Income = {
  id: string | null;
  title: string;
  amount: number;
  date: Date;
  description: string;
  accountId: string;
  categoryId: string;
};

export type IncomeFormProps = {
  row?: Partial<Income> | null;
  onSubmit: (data: Income) => void;
  onCancel?: () => void;
};

export const incomeColumns = [
  sortableColumn<Income>("title", "Title"),
  currencyColumn<Income>("amount", "Amount", {
    locale: "de-DE",
    currency: "EUR",
  }),
  textColumn<Income>("date", "Date"),
  textColumn<Income>("description", "Description"),
  textColumn<Income>("accountId", "Account"),
  textColumn<Income>("categoryId", "Category"),
  actionsColumn<Income>([
    {
      label: "Copy Income ID",
      onClick: (e) =>
        navigator.clipboard.writeText(e.id ?? ""),
    },
    {
      label: "Edit",
      onClick: (e) => console.log(e),
    },
  ]),
]