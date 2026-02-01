import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Wallet } from "lucide-react";

type TopSourceCardProps = {
  name: string;
  percentage: number;
};

export default function TopSourceCard({
  name,
  percentage
}: TopSourceCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Top Source</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          {name ?? "—"}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {(percentage ?? 0).toFixed(1)}% of total income
        </p>
      </CardContent>
    </Card>
  );
}
