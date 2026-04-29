import { useCurrency } from "@/Hooks/useCurrency";

interface ConvertedAmountProps {
  amount: number;
  fromCode: string;
}

/**
 * Renders a currency amount converted to the user's preferred display currency.
 * When the source currency differs from the display currency, shows the original
 * unconverted value underneath in a small greyed-out label.
 */
export function ConvertedAmount({ amount, fromCode }: ConvertedAmountProps) {
  const { format, formatOriginal, userCurrencyCode } = useCurrency();
  const isConverted = fromCode !== userCurrencyCode;

  return (
    <>
      {format(amount, fromCode)}
      {isConverted && (
        <span className="block text-xs font-normal opacity-50 mt-0.5 tabular-nums">
          {formatOriginal(amount, fromCode)}
        </span>
      )}
    </>
  );
}
