export interface UserSettings {
  email: string;
  username: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  baseCurrency: string;
}