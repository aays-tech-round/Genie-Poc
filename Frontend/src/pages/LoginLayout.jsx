import { useEffect } from "react";
import "@/styles/globals.css";
import AuthProvider from "@/auth/AuthProvider";
import LoginPage from "@/auth/LoginPage";

// Layout for the sign-in screen. It shares globals.css with the chat app but not
// the chat's theme (no applySavedTheme): the login screen is always light.
export default function LoginLayout() {
  useEffect(() => {
    document.title = "Sign in · Databricks Genie";
  }, []);

  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
