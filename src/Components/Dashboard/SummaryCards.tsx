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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-foreground">
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