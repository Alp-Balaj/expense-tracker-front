import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import type { LucideIcon } from "lucide-react";

type SummaryCard = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
};

type Props = {
  cards: SummaryCard[];
};

export function SummaryCards({ cards }: Props) {
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-muted-foreground" />
          </CardHeader>

          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-foreground truncate">
              {card.value}
            </div>

            <p
              className={`text-xs ${
                card.changeType === "positive"
                  ? "text-primary"
                  : card.changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {card.change}
              {card.changeType !== "neutral" && " from last month"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}