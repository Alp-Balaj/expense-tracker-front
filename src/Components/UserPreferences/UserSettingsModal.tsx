import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/Components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import { Button } from "@/Components/ui/button";
import { Settings } from "lucide-react";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { usePreferences } from "@/Authorization/UserPreferencesContext";
import { AccountSettings } from "./AccountSettings";
import { PasswordChange } from "./PasswordChange";
import { Preferences } from "./Preferences";
import type { UserSettings, UserPreferences } from "@/Models/UserSettings";
import type { CurrencyDropdown } from "@/Models/Currency";

export function UserSettingsModal() {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, putDataNoId } = useAuthorizationApi();
  const { setPreferences } = usePreferences();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");
  const [currencies, setCurrencies] = useState<CurrencyDropdown[]>([]);

  const fetchCurrencies = useCallback(async () => {
    try { const data = await getAllData<CurrencyDropdown[]>("api/Currency/Dropdown"); setCurrencies(data); }
    catch (e) { console.error("Failed to load currencies", e); }
  }, [getAllData]);

  useEffect(() => { if (isAuthReady && accessToken) fetchCurrencies(); }, [fetchCurrencies, isAuthReady, accessToken]);

  const [userSettings, setUserSettings] = useState<UserSettings>({ email: "", username: "" });
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({ theme: "light", baseCurrency: "USD" });

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    const fetchUserData = async () => {
      const user = await getAllData<UserSettings>("/api/User");
      setUserSettings(user);
      const preferences = await getAllData<UserPreferences>("/api/UserPreferences");
      setUserPreferences(preferences);
    };
    fetchUserData();
  }, [isAuthReady, accessToken, getAllData]);

  const handlePreferencesSave = async (prefs: UserPreferences) => {
    await putDataNoId("/api/UserPreferences", prefs);
    setPreferences(prefs);
    setUserPreferences(prefs);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent className="max-h-160 min-h-160 p-0 gap-0 overflow-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList className="w-full px-6">
            <TabsTrigger value="settings">User Settings</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="p-6">
            <AccountSettings initialSettings={userSettings} onSave={setUserSettings} />
            <PasswordChange />
          </TabsContent>

          <TabsContent value="preferences" className="p-6">
            <Preferences initialPreferences={userPreferences} currencies={currencies} onSave={handlePreferencesSave} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}