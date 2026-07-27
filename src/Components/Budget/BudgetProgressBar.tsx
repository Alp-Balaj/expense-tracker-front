import { barWidth, budgetTone, budgetToneClasses } from "@/lib/budget";

interface BudgetProgressBarProps {
  percentUsed: number;
  className?: string;
  /** Height of the track; defaults to the card-sized bar. */
  height?: "sm" | "md";
}

export function BudgetProgressBar({
  percentUsed,
  className = "",
  height = "md",
}: BudgetProgressBarProps) {
  const tone = budgetTone(percentUsed);
  const width = barWidth(percentUsed);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentUsed)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${Math.round(percentUsed)}% of budget used`}
      className={`w-full overflow-hidden rounded-full bg-muted ${
        height === "sm" ? "h-1.5" : "h-2.5"
      } ${className}`}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${budgetToneClasses[tone].bar}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
