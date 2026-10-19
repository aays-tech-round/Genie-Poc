// LoginPage is intentionally not re-exported here: it imports Bootstrap's
// global CSS, which would be bundled into any route that imports this barrel.
// Import it directly from "@/auth/LoginPage" (only the /login route does).
export { default as AuthProvider } from "./AuthProvider";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as LogoutButton } from "./LogoutButton";
export { useCurrentUser } from "./useCurrentUser";
export { getToken, loginRequest, msalInstance } from "./authConfig";
