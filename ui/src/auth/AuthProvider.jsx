"use client";

import React, { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { msalInstance, isMsalPopup } from "./authConfig";

// Wraps the app in MsalProvider (as App-Frontend/src/App.jsx does).
//
// The sign-in popup lands on redirectUri (the app origin) and the opener
// window reads the auth response from the popup's URL hash. Rendering the
// app inside the popup could redirect "/" -> "/login" and wipe that hash,
// so the popup only shows a placeholder until MSAL closes it.
//
// Next.js renders this on the server too, where there is no window or MSAL
// instance. Nothing auth-related renders until the component has mounted in
// the browser, so the server HTML and the first client render match.
const AuthProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (isMsalPopup()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-300 text-sm">
        Completing sign-in…
      </div>
    );
  }

  // Config missing: no MSAL instance. msal-react's default context reports no
  // accounts and no interaction, so "/" redirects to /login, which shows the
  // missing variables and keeps the sign-in button disabled.
  if (!msalInstance) return children;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export default AuthProvider;
