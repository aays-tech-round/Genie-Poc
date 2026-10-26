// LoginPage is intentionally not re-exported here: it belongs to the /login
// layout only, so it should not be bundled into routes that import this barrel.
// Import it directly from "@/auth/LoginPage".
export { default as AuthProvider } from "./AuthProvider";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as LogoutButton } from "./LogoutButton";
export { useCurrentUser } from "./useCurrentUser";
export { getToken, loginRequest, msalInstance } from "./authConfig";
