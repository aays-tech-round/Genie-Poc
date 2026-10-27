import { MsalProvider } from "@azure/msal-react";
import { msalInstance, isMsalPopup } from "./authConfig";

// Wraps the app in MsalProvider.
//
// The sign-in popup lands on redirectUri (the app origin) and the opener
// window reads the auth response from the popup's URL hash. Rendering the
// app inside the popup could redirect "/" -> "/login" and wipe that hash,
// so the popup only shows a placeholder until MSAL closes it.
const AuthProvider = ({ children }) => {
  if (isMsalPopup()) {
    return (
      <div className="min-h-screen bg-soft flex items-center justify-center text-secondary text-sm">
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
