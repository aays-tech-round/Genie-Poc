import { MsalProvider } from "@azure/msal-react";
import FullScreenMessage from "@/components/ui/FullScreenMessage";
import { msalInstance, isMsalPopup } from "./authConfig";


const AuthProvider = ({ children }) => {
  if (isMsalPopup()) {
    return <FullScreenMessage>Completing sign-in…</FullScreenMessage>;
  }


  if (!msalInstance) return children;

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

export default AuthProvider;
