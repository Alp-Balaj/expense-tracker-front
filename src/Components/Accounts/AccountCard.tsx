import { Card, CardContent, CardFooter } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { TrendingUp } from "lucide-react";

interface AccountCardProps {
  title: string;
  balance: string;
  iban: string;
  owner: string;
  growth: string;
  variant: "primary" | "secondary" | "tertiary";
}

export function AccountCard({
  title,
  balance,
  iban,
  owner,
  growth,
  variant,
}: AccountCardProps) {
  const bgColors = {
    primary: "bg-[#2d3142]",
    secondary: "bg-[#4a5568]",
    tertiary: "bg-primary",
  };

  return (
    <Card className={`${bgColors[variant]} border-0 text-white overflow-hidden py-0`}>
      <CardContent className="p-5 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-white/90">{title}</h3>
          <div className="flex items-center gap-1 text-emerald-400 text-sm">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{growth}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-white/60 mb-1">Available balance</p>
          <p className="text-2xl font-bold text-white">{balance}</p>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-xs text-white/60">IBAN</p>
            <p className="text-sm text-white/90 font-mono">{iban}</p>
          </div>
          <div>
            <p className="text-xs text-white/60">Account owner</p>
            <p className="text-sm text-white/90">{owner}</p>
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
