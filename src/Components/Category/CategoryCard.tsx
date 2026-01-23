import { Card, CardContent, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { CategoryType } from "@/Enums/enums";

interface CategoryCardProps {
  name: string;
  description: string;
  type: CategoryType;
  color: "expense" | "income" | "saving" | "futureExpense";
}

export function CategoryCard({
  name,
  description,
  type,
  color,
}: CategoryCardProps) {
    
  const bgColors= {
    expense: "bg-primary",
    income: "bg-[#4a5568]",
    saving: "bg-[#2d3142]",
    futureExpense: "bg-[#4a5568]",
  };

  return (
    <Card className={`${bgColors[color]} border-0 text-white overflow-hidden py-0`}>
      <CardContent className="p-5 pb-4">
        <div className="mb-4">
          <p className="text-2xl font-bold text-white">{name}</p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white/90">{description}</h3>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-white/60">Type:</p>
            <p className="text-sm text-white/90 font-mono">{type}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-0">
        <Button
          variant="ghost"
          className="w-full rounded-t-none border-t border-white/10 text-white/80 hover:text-white hover:bg-white/10 h-11"
        >
          See details
        </Button>
      </CardFooter>
    </Card>
  );
}
