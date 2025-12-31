import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";

import { AuthorizationProvider } from "./Authorization/AuthContext";
import RequireAuth from "./Authorization/RequireAuthentication";

function App() {
  return (
    <BrowserRouter>
      <AuthorizationProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthorizationProvider>
    </BrowserRouter>
  );
}

export default App;
