import { useEffect } from "react";
import "@/styles/globals.css";
import AuthProvider from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { applySavedTheme } from "@/constants/theme";
import Home from "./Home";

applySavedTheme();

// Layout for the chat app. Every route in it, including "/", requires a signed-in user.
export default function MainLayout() {
  useEffect(() => {
    document.title = "Databricks Genie";
  }, []);

  return (
    <AuthProvider>
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    </AuthProvider>
  );
}
