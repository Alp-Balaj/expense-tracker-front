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

import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuthenticationApi } from "../../Hooks/useAuthenticationApi";
import { useAuth } from "../../Authorization/AuthContext";
import type { SignUpRequest } from "../../Models/UserAuth";
import { Spinner } from "../ui/spinner";

type SignupFormProps = React.ComponentProps<"div"> & {
  data?: Partial<SignUpRequest> | null;
  changePageState?: () => void; // optional: if you want the "Sign in" link to toggle views
};

type FormShape = SignUpRequest & { confirmPassword: string };

export function SignUpForm({
  className,
  data,
  changePageState,
  ...props
}: SignupFormProps) {
  const { signup } = useAuthenticationApi();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormShape>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!data) return;
    reset({
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email: data.email ?? "",
      password: "",
      confirmPassword: "",
    });
  }, [data, reset]);

  const onSubmit: SubmitHandler<FormShape> = async (formData) => {
    setServerError("");
    try {
      // Only send what backend expects (SignUpRequest)
      const payload: SignUpRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      };

      await signup(payload);
      navigate("/", { replace: true });
    } catch (error) {
      setServerError("Registering user failed");
      console.error("Registering user failed:", error);
    }
  };

  if (accessToken) return <Navigate to="/" replace />;

  const password = watch("password");

  return (
    <div style={{minWidth: '400px'}} className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldGroup>
              <Field className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First Name"
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                  />
                  {errors.firstName && (
                    <FieldDescription>{String(errors.firstName.message)}</FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name"
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.lastName && (
                    <FieldDescription>{String(errors.lastName.message)}</FieldDescription>
                  )}
                </Field>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && (
                  <FieldDescription>{String(errors.email.message)}</FieldDescription>
                )}
              </Field>

              <Field className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    {...register("password", { required: "Password is required" })}
                  />
                  {errors.password && (
                    <FieldDescription>{String(errors.password.message)}</FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword", {
                      required: "Confirm password is required",
                      validate: (v) => v === password || "Passwords do not match",
                    })}
                  />
                  {errors.confirmPassword && (
                    <FieldDescription>
                      {String(errors.confirmPassword.message)}
                    </FieldDescription>
                  )}
                </Field>
              </Field>

              <FieldDescription>Must be at least 8 characters long.</FieldDescription>

              {serverError && (
                <FieldDescription className="text-destructive">
                  {serverError}
                </FieldDescription>
              )}

              <div className="pt-2">
                <Button style={{width: '100%'}} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner />
                      <span className="ml-2">"Registering user..."</span>
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  {changePageState ? (
                    <button
                      type="button"
                      className="underline"
                      onClick={changePageState}
                    >
                      Sign in
                    </button>
                  ) : (
                    <a className="underline" href="#">
                      Sign in
                    </a>
                  )}
                </FieldDescription>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
