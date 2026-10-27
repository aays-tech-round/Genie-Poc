import { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

// Renders children only for a signed-in user; otherwise sends them to /login.
const ProtectedRoute = ({ children }) => {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // Wait for MSAL startup / redirect handling (e.g. returning from logout)
  // before deciding, so the user isn't bounced while the cache is loading.
  const starting =
    inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect;
  const shouldRedirect = !isAuthenticated && !starting;

  useEffect(() => {
    if (shouldRedirect) window.location.replace("/login");
  }, [shouldRedirect]);

  if (isAuthenticated) return children;

  if (starting) {
    return (
      <div className="min-h-screen bg-soft flex items-center justify-center text-secondary text-sm">
        Loading…
      </div>
    );
  }

  return null;
};

export default ProtectedRoute;
