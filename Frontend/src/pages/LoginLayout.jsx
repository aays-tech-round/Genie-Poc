import { useEffect } from "react";
import "@/auth/login.css";
import AuthProvider from "@/auth/AuthProvider";
import LoginPage from "@/auth/LoginPage";

// Separate layout so the login screen gets full Tailwind (with preflight)
// without the main app's globals.css. Moving between this and MainLayout is
// a full page load, so neither page's global CSS leaks into the other.
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
