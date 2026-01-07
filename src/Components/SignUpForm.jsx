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
  div{
    margin-bottom: 15px;
  }
`;

function SignUpForm({ data, ...props }) {
  const { signup } = useAuthenticationApi();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");

  const methods = useForm({
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const { handleSubmit, reset, register, formState: { errors, isSubmitting } } = methods;

  useEffect(() => {
    if (data) {
      reset({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        password: "",
      });
    }
  }, [data, reset]);
  
  const internalSubmit = async (formData) => {
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
      <h1 style={{marginBottom: 0}}>Sign-Up Form</h1>
      <p>Already have an account? <button onClick={props.changePageState}>Login!</button></p>

      <Input
        placeholder="FirstName"
        {...register("firstName", { required: "First name is required" })}
        type="text"
      />
      {errors.firstName && <p>{errors.firstName.message}</p>}

      <Input
        placeholder="LastName"
        {...register("lastName", { required: "Last name is required" })}
        type="text"
      />
      {errors.lastName && <p>{errors.lastName.message}</p>}

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
        {isSubmitting ? "Registering user..." : "Sign Up"}
      </button>
    </FormContainer>
  );
}

export default SignUpForm;
