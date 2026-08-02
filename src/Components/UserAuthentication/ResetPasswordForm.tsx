import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

import { useAuth } from "../../Authorization/AuthContext";
import { resetPasswordApi } from "../../Services/loginServices";

type FormShape = { newPassword: string; confirmPassword: string };

export function ResetPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const { accessToken } = useAuth();

  // The emailed link lands here: /reset-password?email=…&token=…
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [serverError, setServerError] = useState("");
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({ defaultValues: { newPassword: "", confirmPassword: "" } });

  const onSubmit: SubmitHandler<FormShape> = async (formData) => {
    setServerError("");
    try {
      await resetPasswordApi(email, token, formData.newPassword);
      setDone(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Resetting the password failed");
    }
  };

  if (accessToken) return <Navigate to="/" replace />;

  const linkIsBroken = !email || !token;
  const newPassword = watch("newPassword");

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md px-4 sm:px-0", className)} {...props}>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {linkIsBroken ? "Something is wrong with this link" : `Choose a new password for ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {linkIsBroken ? (
            <FieldGroup>
              <FieldDescription>
                This reset link is incomplete. Open the link from the email again, or
                request a new one.
              </FieldDescription>
              <FieldDescription className="text-center">
                <Link to="/forgot-password" className="underline underline-offset-4 hover:no-underline">
                  Request a new link
                </Link>
              </FieldDescription>
            </FieldGroup>
          ) : done ? (
            <FieldGroup>
              <FieldDescription>
                Your password has been reset. Log in with the new one.
              </FieldDescription>
              <FieldDescription className="text-center">
                <Link to="/login" className="underline underline-offset-4 hover:no-underline">
                  Go to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="newPassword">New password</FieldLabel>
                  <Input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("newPassword", {
                      required: "Password is required",
                      minLength: { value: 8, message: "Password must be at least 8 characters" },
                    })}
                  />
                  {errors.newPassword?.message && (
                    <FieldDescription className="text-sm text-destructive">
                      {String(errors.newPassword.message)}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword", {
                      required: "Confirm password is required",
                      validate: (v) => v === newPassword || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword?.message && (
                    <FieldDescription className="text-sm text-destructive">
                      {String(errors.confirmPassword.message)}
                    </FieldDescription>
                  )}
                </Field>

                <FieldDescription>Must be at least 8 characters long.</FieldDescription>

                {serverError && (
                  <FieldDescription className="text-sm text-destructive">
                    {serverError}
                  </FieldDescription>
                )}

                <Field>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Spinner />
                        <span className="ml-2">Resetting</span>
                      </>
                    ) : (
                      "Reset password"
                    )}
                  </Button>

                  <FieldDescription className="text-center">
                    <Link to="/login" className="underline underline-offset-4 hover:no-underline">
                      Back to login
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
