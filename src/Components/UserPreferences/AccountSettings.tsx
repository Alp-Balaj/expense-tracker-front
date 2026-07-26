import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Check } from "lucide-react";
import type { UserSettings } from "@/Models/UserSettings";

interface AccountSettingsProps {
  initialSettings: UserSettings;
  onSave: (settings: UserSettings) => Promise<void>;
}

export function AccountSettings({ initialSettings, onSave }: AccountSettingsProps) {
  const [username, setUsername] = useState(initialSettings.username);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError("");
    if (!username.trim()) return setError("Username is required");

    setSaving(true);
    try {
      await onSave({ email: initialSettings.email, username: username.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving account settings failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={initialSettings.email} disabled />
        <p className="text-xs text-muted-foreground">Email is used to log in and can't be changed here.</p>
      </div>
      <div className="space-y-2">
        <Label>Username</Label>
        <Input value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground">
        {saved ? <><Check className="h-4 w-4 mr-2" /> Saved</> : saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
