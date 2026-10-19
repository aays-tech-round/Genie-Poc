"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

// Renders children only for a signed-in user; otherwise sends them to /login.
const ProtectedRoute = ({ children }) => {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  // Wait for MSAL startup / redirect handling (e.g. returning from logout)
  // before deciding, so the user isn't bounced while the cache is loading.
  const starting =
    inProgress === InteractionStatus.Startup || inProgress === InteractionStatus.HandleRedirect;
  const shouldRedirect = !isAuthenticated && !starting;

  useEffect(() => {
    if (shouldRedirect) router.replace("/login");
  }, [shouldRedirect, router]);

  if (isAuthenticated) return children;

  if (starting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-300 text-sm">
        Loading…
      </div>
    );
  }

  return null;
};

export default ProtectedRoute;
