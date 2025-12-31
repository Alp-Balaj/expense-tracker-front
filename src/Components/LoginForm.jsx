import styled from "styled-components";
import Input from "@mui/material/Input";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthenticationApi } from "../Hooks/useAuthenticationApi";
import { useAuth } from "../Authorization/AuthContext";

const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  width: 300px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
`;

function LoginForm({ data }) {
  const { login } = useAuthenticationApi();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const methods = useForm({
    defaultValues: { email: "", password: "" },
  });

  const { handleSubmit, reset, register, formState: { errors, isSubmitting } } = methods;

  useEffect(() => {
    if (data) {
      reset({
        email: data.name || "",
        password: "",
      });
    }
  }, [data, reset]);

  const internalSubmit = async (formData) => {
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
      <h1>Login Form</h1>

      <Input
        placeholder="Email"
        {...register("email", { required: "Email is required" })}
        type="email"
      />
      {errors.email && <p>{errors.email.message}</p>}

      <Input
        type="password"
        placeholder="Password"
        {...register("password", { required: "Password is required" })}
      />
      {errors.password && <p>{errors.password.message}</p>}

      {serverError && <p>{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in..." : "Login"}
      </button>
    </FormContainer>
  );
}

export default LoginForm;
