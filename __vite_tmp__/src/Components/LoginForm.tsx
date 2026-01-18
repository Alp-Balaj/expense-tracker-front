import styled from "styled-components";
import Input from "@mui/material/Input";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthenticationApi } from "../Hooks/useAuthenticationApi";
import { useAuth } from "../Authorization/AuthContext";
import type { LoginRequest } from "../Models/UserAuth";

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  div {
    margin-bottom: 15px;
  }
`;

type LoginFormProps = {
  data?: { name?: string } | null;
  changePageState?: () => void;
};

function LoginForm({ data, changePageState }: LoginFormProps) {
  const { login } = useAuthenticationApi();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string>("");

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (data) {
      reset({
        email: data.name ?? "",
        password: "",
      });
    }
  }, [data, reset]);

  const internalSubmit: SubmitHandler<LoginRequest> = async (formData) => {
    setServerError("");
    try {
      await login(formData);
      navigate("/", { replace: true });
    } catch (error) {
      setServerError("Login failed");
      console.error("Login failed:", error);
    }
  };

  if (accessToken) return <Navigate to="/" replace />;

  return (
    <FormContainer onSubmit={handleSubmit(internalSubmit)}>
      <h1 style={{ marginBottom: 0 }}>Login Form</h1>

      <p>
        Don&apos;t have an account?{" "}
        <button type="button" onClick={changePageState}>
          Sign up!
        </button>
      </p>

      <Input
        placeholder="Email"
        type="email"
        {...register("email", { required: "Email is required" })}
      />
      {errors.email && <p>{String(errors.email.message)}</p>}

      <Input
        type="password"
        placeholder="Password"
        {...register("password", { required: "Password is required" })}
      />
      {errors.password && <p>{String(errors.password.message)}</p>}

      {serverError && <p>{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </FormContainer>
  );
}

export default LoginForm;
