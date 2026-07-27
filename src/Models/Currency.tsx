export type Currency = {
  id: string | null;
  code: string;
  name: string;
  symbol: string;
  /**
   * Multiplier into the user's base currency: `amountInBase = amount * rate`.
   * See @/lib/exchangeRates for why the direction matters.
   */
  exchangeRateToBase: number;
  /**
   * When the rate was last set, server-side (ISO 8601, UTC). Null on rows that
   * predate the auto-updater, i.e. the age is unknown rather than old.
   * Output only — the server ignores it on write.
   */
  rateUpdatedAtUtc?: string | null;
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