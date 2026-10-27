import { useEffect } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import FullScreenMessage from "@/components/ui/FullScreenMessage";

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

  if (starting) return <FullScreenMessage>Loading…</FullScreenMessage>;

  return null;
};

export default ProtectedRoute;
