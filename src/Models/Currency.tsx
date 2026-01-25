export type Currency = {
  id: string | null;
  code: string;
  name: string;
  symbol: string;
  exchangeRateToBase: number;
};

export type CurrencyFormProps = {
  row?: Partial<Currency> | null;
  onSubmit: (data: Currency) => void;
  onCancel?: () => void;
};

export type CurrencyDropdown = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRateToBase: number;
}