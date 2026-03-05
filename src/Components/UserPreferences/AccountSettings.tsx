import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Check } from "lucide-react";
import type { UserSettings } from "@/Models/UserSettings";

interface AccountSettingsProps {
  initialSettings: UserSettings;
  onSave?: (settings: UserSettings) => void;
}

export function AccountSettings({ initialSettings, onSave }: AccountSettingsProps) {
  const [email, setEmail] = useState(initialSettings.email);
  const [username, setUsername] = useState(initialSettings.username);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave?.({ email, username });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <Button onClick={handleSave} className="w-full bg-primary text-primary-foreground">
        {saved ? <><Check className="h-4 w-4 mr-2" /> Saved</> : "Save Changes"}
      </Button>
    </div>
  );
}