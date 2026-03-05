import { useState } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Eye, EyeOff, Check } from "lucide-react";

interface PasswordChangeProps {
  onPasswordChange?: (current: string, next: string) => void;
}

export function PasswordChange({ onPasswordChange }: PasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [changed, setChanged] = useState(false);

  const handleChange = () => {
    setError("");
    if (!currentPassword || !newPassword || !confirmPassword) return setError("All fields required");
    if (newPassword.length < 8) return setError("Password must be at least 8 chars");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    onPasswordChange?.(currentPassword, newPassword);
    setChanged(true);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setChanged(false), 2000);
  };

  const renderInput = (label: string, value: string, setValue: any, show: boolean, toggleShow: any) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input type={show ? "text" : "password"} value={value} onChange={(e) => setValue(e.target.value)} className="pr-10" />
        <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={toggleShow}>
          {show ? <EyeOff className="h-4 w-4 text-muted-foreground"/> : <Eye className="h-4 w-4 text-muted-foreground"/>}
        </Button>
      </div>
    </div>
  );

  return (
    <Accordion type="single" collapsible className="max-w-lg">
      <AccordionItem value="password">
        <AccordionTrigger>Change password?</AccordionTrigger>
        <AccordionContent className="space-y-4">
          {renderInput("Current Password", currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(!showCurrent))}
          {renderInput("New Password", newPassword, setNewPassword, showNew, () => setShowNew(!showNew))}
          {renderInput("Confirm Password", confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(!showConfirm))}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleChange} className="w-full bg-primary text-primary-foreground">
            {changed ? <><Check className="h-4 w-4 mr-2"/> Changed</> : "Change Password"}
          </Button>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}