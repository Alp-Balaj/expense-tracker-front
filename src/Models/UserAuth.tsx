export type LoginRequest = {
  email: string;
  password: string;
};

export type SignUpRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type AuthResponse = {
  isAuthSuccessful: boolean;
  token?: string;
  message?: string;
};