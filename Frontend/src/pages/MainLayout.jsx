import "@/styles/globals.css";
import AuthProvider from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { applySavedTheme } from "@/lib/theme";
import Home from "./Home";

applySavedTheme();

// Layout for the chat app. Every route in it, including "/", requires a signed-in user.
export default function MainLayout() {
  return (
    <AuthProvider>
      <title>Databricks Genie</title>
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    </AuthProvider>
  );
}
