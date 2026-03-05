import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Check } from "lucide-react";
import type { UserPreferences } from "@/Models/UserSettings";
import type { CurrencyDropdown } from "@/Models/Currency";

interface PreferencesProps {
  initialPreferences: UserPreferences;
  currencies: CurrencyDropdown[];
  onSave?: (preferences: UserPreferences) => void;
}

export function Preferences({ initialPreferences, currencies, onSave }: PreferencesProps) {
  const [theme, setTheme] = useState(initialPreferences.theme);
  const [baseCurrency, setBaseCurrency] = useState(initialPreferences.baseCurrency);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.({ theme, baseCurrency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Theme</Label>
        <div className="grid grid-cols-3 gap-2">
          {["light", "dark", "system"].map((t) => (
            <Button key={t} onClick={() => setTheme(t as any)} className={theme === t ? "bg-primary text-primary-foreground" : "outline"}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <Label>Base Currency</Label>
        <Select value={baseCurrency} onValueChange={setBaseCurrency}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select a currency"/></SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground">
        {saved ? <><Check className="h-4 w-4 mr-2"/> Saved</> : "Save Preferences"}
      </Button>
    </div>
  );
}