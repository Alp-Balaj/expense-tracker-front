"use client";

import { Card, CardContent } from "@/Components/ui/card";
import { Eye, EyeOff, Wifi } from "lucide-react";
import { useState } from "react";

interface BankCardProps {
  type: "credit" | "debit";
  balance: string;
  cardNumber: string;
  expiryDate: string;
  isPhysical?: boolean;
  isActive?: boolean;
  expiryWarning?: string;
}

export function BankCard({
  type,
  balance,
  cardNumber,
  expiryDate,
  isPhysical = true,
  isActive = true,
  expiryWarning,
}: BankCardProps) {
  const [showNumber, setShowNumber] = useState(false);

  const maskedNumber = cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 **** **** $4");
  const fullNumber = cardNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");

  const cardColors = {
    credit: "from-primary via-primary/90 to-primary/80",
    debit: "from-[#4A90A4] via-[#5BA5B8] to-[#6DBAC8]",
  };

  return (
    <Card className="border-border overflow-hidden py-0 gap-0">
      <div className="flex flex-col md:flex-row">
        {/* Card Visual */}
        <div className={`bg-gradient-to-br ${cardColors[type]} p-5 min-w-[220px] md:min-w-[200px] aspect-[1.6/1] flex flex-col justify-between`}>
          <div className="flex items-start justify-between">
            <div className="flex gap-2 items-center">
              <div className="w-8 h-6 rounded bg-white/30 flex items-center justify-center">
                <div className="w-5 h-4 rounded-sm bg-gradient-to-r from-amber-200 to-amber-300" />
              </div>
            </div>
            <Wifi className="h-5 w-5 text-white/70 rotate-90" />
          </div>

          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-white/70">Available Balance</p>
              <p className="text-xl font-bold text-white">{balance}</p>
            </div>
            <p className="text-sm font-mono text-white/90 tracking-wider">
              {maskedNumber}
            </p>
          </div>
        </div>

        {/* Card Details */}
        <CardContent className="flex-1 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {type === "credit" ? "Credit Card" : "Debit Card"}
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {isPhysical ? "Physical" : "Virtual"}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs ${isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Card number</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-foreground">
                  {showNumber ? fullNumber : maskedNumber}
                </span>
                <button
                  onClick={() => setShowNumber(!showNumber)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Expiration date</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{expiryDate}</span>
                {expiryWarning && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {expiryWarning}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
