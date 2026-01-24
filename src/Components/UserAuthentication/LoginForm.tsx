import * as React from "react"
import { useEffect, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { Navigate, useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../ui/field"
import { Input } from "../ui/input"
import { Spinner } from "../ui/spinner"

import { useAuthenticationApi } from "../../Hooks/useAuthenticationApi"
import { useAuth } from "../../Authorization/AuthContext"
import type { LoginRequest } from "../../Models/UserAuth"

type LoginFormProps = React.ComponentProps<"div"> & {
  data?: { name?: string } | null
  changePageState?: () => void
}

export function LoginForm({ className, data, changePageState, ...props }: LoginFormProps) {
  const { login } = useAuthenticationApi()
  const { accessToken } = useAuth()
  const navigate = useNavigate()

  const [serverError, setServerError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    defaultValues: { email: "", password: "" },
  })

  useEffect(() => {
    if (!data) return
    reset({
      email: data.name ?? "",
      password: "",
    })
  }, [data, reset])

  const internalSubmit: SubmitHandler<LoginRequest> = async (formData) => {
    setServerError("")
    try {
      await login(formData)
      navigate("/", { replace: true })
    } catch (error) {
      setServerError("Login failed")
      console.error("Login failed:", error)
    }
  }

  if (accessToken) return <Navigate to="/" replace />

  return (
    <div style={{minWidth: '400px'}} className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(internalSubmit)}>
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

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot your password?
                  </a>
                </div>

                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password", { required: "Password is required" })}
                />
                {errors.password?.message && (
                  <FieldDescription className="text-sm text-destructive">
                    {String(errors.password.message)}
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
                      <span className="ml-2">Login</span>
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>

                <Button variant="outline" type="button" className="w-full">
                  Login with Google
                </Button>

                <FieldDescription className="text-center">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={changePageState}
                    className="underline underline-offset-4 hover:no-underline"
                  >
                    Sign up
                  </button>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
