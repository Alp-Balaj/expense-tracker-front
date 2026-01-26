import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Settings, User, Palette, Eye, EyeOff, Check } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import type { CurrencyDropdown } from "@/Models/Currency";
import type { AxiosError } from "axios";
import { useAuth } from "@/Authorization/AuthContext";
import { useAuthorizationApi } from "@/Hooks/useAuthorizationApi";
import { usePreferences } from "@/Authorization/UserPreferencesContext";

interface UserSettings {
  email: string;
  username: string;
}

interface UserPreferences {
  theme: "light" | "dark" | "system";
  baseCurrency: string;
}

interface UserSettingsModalProps {
  initialSettings?: UserSettings;
  initialPreferences?: UserPreferences;
  onSettingsSave?: (settings: UserSettings) => void;
  onPreferencesSave?: (preferences: UserPreferences) => void;
  onPasswordChange?: (currentPassword: string, newPassword: string) => void;
}

export function UserSettingsModal({
  initialSettings = { email: "john.doe@example.com", username: "johndoe" },
  initialPreferences = { theme: "light", baseCurrency: "USD" },
  onSettingsSave,
  onPreferencesSave,
  onPasswordChange,
}: UserSettingsModalProps) {
  const { accessToken, isAuthReady } = useAuth();
  const { getAllData, putDataNoId } = useAuthorizationApi();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  const { setPreferences } = usePreferences();


  //#region Currency dropdown
  const [currencies, setCurrencies] = useState<CurrencyDropdown[]>([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [currencyLoadError, setCurrencyLoadError] = useState<string | null>(null);

  const fetchCurrencies = useCallback(async () => {
    setIsLoadingCurrencies(true);
    setCurrencyLoadError(null);

    try {
      const data = await getAllData<CurrencyDropdown[]>("api/Currency/Dropdown");
      setCurrencies(data);
    } catch (e: unknown) {
      const err = e as AxiosError;
      if (err.response?.status !== 401) {
        setCurrencyLoadError("Failed to load currencies.");
        console.error(currencyLoadError);
      }
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, [getAllData]);

  useEffect(() => {
    if (!isAuthReady || !accessToken) return;
    if(!isLoadingCurrencies)
        fetchCurrencies();
  },[fetchCurrencies]);

  // User Settings State
  const [email, setEmail] = useState(initialSettings.email);
  const [username, setUsername] = useState(initialSettings.username);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);

  // User Preferences State
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    initialPreferences.theme
  );
  const [baseCurrency, setBaseCurrency] = useState(
    initialPreferences.baseCurrency
  );
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  const handleSettingsSave = () => {
    onSettingsSave?.({ email, username });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const handlePasswordChange = () => {
    setPasswordError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    onPasswordChange?.(currentPassword, newPassword);
    setPasswordChanged(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordChanged(false), 2000);
  };

  const handlePreferencesSave = useCallback(async () => {
    await putDataNoId<UserPreferences>("/api/UserPreferences", {
      theme,
      baseCurrency,
    });
    setPreferences({ theme, baseCurrency });
    onPreferencesSave?.({ theme, baseCurrency });
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 2000);
  }, [theme, baseCurrency, onPreferencesSave]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-160 min-h-160 p-0 gap-0 overflow-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col"
        >
          <TabsList className="w-full align-start justify-start rounded-none border-b border-border bg-transparent h-auto p-0 px-6">
            <TabsTrigger
              value="settings"
              className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              <User className="h-4 w-4 mr-2" />
              User Settings
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 font-medium text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              <Palette className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="settings"
            className="p-6 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="space-y-6">
              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Account Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="bg-background"
                  />
                </div>

                <Button
                  onClick={handleSettingsSave}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>

              <Accordion
                type="single"
                collapsible
                className="max-w-lg"
              >
                <AccordionItem value="password">
                  <AccordionTrigger className="cursor-pointer">Change password?</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="currentPassword" className="text-foreground">
                            Current Password
                          </Label>
                        </div>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="newPassword" className="text-foreground">
                            New Password
                          </Label>
                        </div>

                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <Label htmlFor="confirmPassword" className="text-foreground">
                            Confirm New Password
                          </Label>

                        </div>

                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="bg-background pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {passwordError && (
                        <p className="text-sm text-destructive">{passwordError}</p>
                      )}

                      <Button
                        onClick={handlePasswordChange}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {passwordChanged ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Password Changed
                          </>
                        ) : (
                          "Change Password"
                        )}
                      </Button>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent
            value="preferences"
            className="p-6 mt-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <div className="space-y-6">
              {/* Theme Settings */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Appearance
                </h3>

                <div className="space-y-3">
                  <Label className="text-foreground">Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col gap-1 ${
                        theme === "light"
                          ? "bg-primary text-primary-foreground"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                      onClick={() => setTheme("light")}
                    >
                      <div className="w-8 h-5 rounded border border-current bg-background" />
                      <span className="text-xs">Light</span>
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col gap-1 ${
                        theme === "dark"
                          ? "bg-primary text-primary-foreground"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                      onClick={() => setTheme("dark")}
                    >
                      <div className="w-8 h-5 rounded border border-current bg-foreground" />
                      <span className="text-xs">Dark</span>
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "system" ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col gap-1 ${
                        theme === "system"
                          ? "bg-primary text-primary-foreground"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}
                      onClick={() => setTheme("system")}
                    >
                      <div className="w-8 h-5 rounded border border-current bg-gradient-to-r from-background to-foreground" />
                      <span className="text-xs">System</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Currency Settings */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-foreground">
                  Regional Settings
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">
                    Base Currency
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    All amounts will be displayed in this currency by default
                  </p>
                  <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select a currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.id} value={currency.id}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium w-10">
                              {currency.code}
                            </span>
                            <span className="text-muted-foreground">
                              {currency.name} ({currency.symbol})
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handlePreferencesSave}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {preferencesSaved ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Preferences Saved
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
