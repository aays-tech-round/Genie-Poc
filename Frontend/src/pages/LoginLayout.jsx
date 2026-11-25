import "@/styles/globals.css";
import AuthProvider from "@/auth/AuthProvider";
import LoginPage from "@/auth/LoginPage";

export default function LoginLayout() {
  return (
    <AuthProvider>
      <title>Sign in · Databricks Genie</title>
      <LoginPage />
    </AuthProvider>
  );
}
