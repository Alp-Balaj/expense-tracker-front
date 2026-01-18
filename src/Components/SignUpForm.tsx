import styled from "styled-components";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthenticationApi } from "../Hooks/useAuthenticationApi";
import { useAuth } from "../Authorization/AuthContext";
import type { SignUpRequest } from "../Models/UserAuth";


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

type SignUpFormProps = {
  data?: Partial<SignUpRequest> | null;
  changePageState?: () => void;
};

function SignUpForm({ data, changePageState }: SignUpFormProps) {
  const { signup } = useAuthenticationApi();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string>("");

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<SignUpRequest>({
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  useEffect(() => {
    if (data) {
      reset({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
        password: "",
      });
    }
  }, [data, reset]);

  const internalSubmit: SubmitHandler<SignUpRequest> = async (formData) => {
    setServerError("");
    try {
      await signup(formData);
      navigate("/", { replace: true });
    } catch (error) {
      setServerError("Registering user failed");
      console.error("Registering user failed:", error);
    }
  };

  if (accessToken) return <Navigate to="/" replace />;

  return (
    <FormContainer onSubmit={handleSubmit(internalSubmit)}>
      <h1 style={{ marginBottom: 0 }}>Sign-Up Form</h1>

      <p>
        Already have an account?{" "}
        <button type="button" onClick={changePageState}>
          Login!
        </button>
      </p>

      <input
        placeholder="FirstName"
        type="text"
        {...register("firstName", { required: "First name is required" })}
      />
      {errors.firstName && <p>{String(errors.firstName.message)}</p>}

      <input
        placeholder="LastName"
        type="text"
        {...register("lastName", { required: "Last name is required" })}
      />
      {errors.lastName && <p>{String(errors.lastName.message)}</p>}

      <input
        placeholder="Email"
        type="email"
        {...register("email", { required: "Email is required" })}
      />
      {errors.email && <p>{String(errors.email.message)}</p>}

      <input
        type="password"
        placeholder="Password"
        {...register("password", { required: "Password is required" })}
      />
      {errors.password && <p>{String(errors.password.message)}</p>}

      {serverError && <p>{serverError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Registering user..." : "Sign Up"}
      </button>
    </FormContainer>
  );
}

export default SignUpForm;
