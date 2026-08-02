import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";

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
import { forgotPasswordApi } from "../../Services/loginServices";

type FormShape = { email: string };

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
  const { accessToken } = useAuth();

  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({ defaultValues: { email: "" } });

  const onSubmit: SubmitHandler<FormShape> = async (formData) => {
    setServerError("");
    try {
      await forgotPasswordApi(formData.email);
      setSent(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sending the reset link failed");
    }
  };

  if (accessToken) return <Navigate to="/" replace />;

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md px-4 sm:px-0", className)} {...props}>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset it
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <FieldGroup>
              <FieldDescription>
                If that email is registered, a reset link is on its way. Check your inbox
                and follow the link to choose a new password.
              </FieldDescription>
              <FieldDescription className="text-center">
                <Link to="/login" className="underline underline-offset-4 hover:no-underline">
                  Back to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    autoComplete="email"
                    {...register("email", { required: "Email is required" })}
                  />
                  {errors.email?.message && (
                    <FieldDescription className="text-sm text-destructive">
                      {String(errors.email.message)}
                    </FieldDescription>
                  )}
                </Field>

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
                        <span className="ml-2">Sending link</span>
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </Button>

                  <FieldDescription className="text-center">
                    Remembered it?{" "}
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
