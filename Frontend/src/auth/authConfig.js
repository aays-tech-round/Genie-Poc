import { BrowserAuthError, PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";


const clientId = import.meta.env.VITE_SSO_CLIENT_ID;
const authority = import.meta.env.VITE_SSO_AUTHORITIES;
const knownAuthority = import.meta.env.VITE_SSO_KNOWN_AUTHORITIES;
const apiScope = import.meta.env.VITE_SSO_API_SCOPE;

export const missingConfig = [
  !clientId && "VITE_SSO_CLIENT_ID",
  !authority && "VITE_SSO_AUTHORITIES",
  !apiScope && "VITE_SSO_API_SCOPE",
].filter(Boolean);

export const missingConfigMessage = `Sign-in is not configured. Missing environment variables: ${missingConfig.join(", ")}`;

const msalConfig = {
  auth: {
    clientId,
    authority,
    knownAuthorities: knownAuthority ? [knownAuthority] : [],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const loginRequest = {
  scopes: apiScope ? [apiScope] : [],
};


export const msalInstance =
  missingConfig.length === 0 ? new PublicClientApplication(msalConfig) : null;

const msalReady = msalInstance ? msalInstance.initialize() : Promise.resolve();

// Window names MSAL gives its popups ("msal.<id>"); see isInPopup() in msal-browser.
export const isMsalPopup = () =>
  typeof window !== "undefined" &&
  !!window.opener &&
  window.opener !== window &&
  typeof window.name === "string" &&
  window.name.indexOf("msal.") === 0;

// Popup errors that mean the browser blocked or closed the window before it could open.
const POPUP_BLOCKED = new Set(["popup_window_error", "empty_window_error"]);

// getToken runs in the background (polling, loading chats), not from a click, so a popup may be
// blocked. Then the whole page goes to Microsoft sign-in instead; MsalProvider finishes it on return.
const signInAgain = async (request) => {
  try {
    return (await msalInstance.acquireTokenPopup(request)).accessToken;
  } catch (error) {
    if (!(error instanceof BrowserAuthError && POPUP_BLOCKED.has(error.errorCode))) throw error;
    await msalInstance.acquireTokenRedirect(request);
    throw new Error("Redirecting to sign in…", { cause: error });
  }
};

// Access token for the protected API: silent first, then sign-in again if interaction is required.
export const getToken = async () => {
  if (!msalInstance) {
    throw new Error(
      missingConfig.length ? missingConfigMessage : "getToken() can only be called in the browser."
    );
  }
  await msalReady;
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];

  if (!account) {
    // Not signed in (e.g. the session was cleared in another tab): back to the login page.
    window.location.replace("/login");
    throw new Error("You are signed out. Please sign in again.");
  }

  const request = { account, scopes: loginRequest.scopes };
  try {
    return (await msalInstance.acquireTokenSilent(request)).accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) return signInAgain(request);
    throw error;
  }
};
