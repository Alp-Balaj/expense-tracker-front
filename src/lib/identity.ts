/** Presentation helpers for the person and the money the app chrome shows. */

/** "Alp Balaj" -> "AB", "alp" -> "AL", "" -> "?". */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * The symbol a currency code prints as — "EUR" -> "€". Falls back to the code
 * itself for currencies the runtime has no symbol for, and to "€" (the app's
 * base currency) when no code is known yet — e.g. a form before an account
 * is picked.
 */
export function currencySymbol(code?: string | null): string {
  if (!code) return "€";
  try {
    const part = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}
