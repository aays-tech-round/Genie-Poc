import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

// MSAL (Microsoft Entra ID) settings. Env vars use Vite's VITE_ prefix so they
// are inlined into the browser bundle.

const clientId = import.meta.env.VITE_SSO_CLIENT_ID;
const authority = import.meta.env.VITE_SSO_AUTHORITIES;
const knownAuthority = import.meta.env.VITE_SSO_KNOWN_AUTHORITIES;
const apiScope = import.meta.env.VITE_SSO_API_SCOPE;

// Without an authority MSAL silently falls back to the multi-tenant
// "common" endpoint, so a missing value must block login instead.
export const missingConfig = [
  !clientId && "VITE_SSO_CLIENT_ID",
  !authority && "VITE_SSO_AUTHORITIES",
  !apiScope && "VITE_SSO_API_SCOPE",
].filter(Boolean);

export const msalConfig = {
  auth: {
    clientId,
    authority,
    knownAuthorities: knownAuthority ? [knownAuthority] : [],
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: apiScope ? [apiScope] : [],
};

// null when required config is missing (an unconfigured instance can fail to
// initialize, leaving the app stuck on "Loading…" instead of reaching /login,
// which explains what is missing). AuthProvider renders without MsalProvider
// in that case, so every user is treated as signed out.
export const msalInstance =
  missingConfig.length === 0 ? new PublicClientApplication(msalConfig) : null;

// Ensure initialized BEFORE any call.
const msalReady = msalInstance ? msalInstance.initialize() : Promise.resolve();

// Window names MSAL gives its popups ("msal.<id>"); see isInPopup() in msal-browser.
export const isMsalPopup = () =>
  typeof window !== "undefined" &&
  !!window.opener &&
  window.opener !== window &&
  typeof window.name === "string" &&
  window.name.indexOf("msal.") === 0;

// Access token for the protected API: silent first, popup if interaction is required.
export const getToken = async () => {
  if (!msalInstance) {
    throw new Error(
      missingConfig.length
        ? `Sign-in is not configured. Missing environment variables: ${missingConfig.join(", ")}`
        : "getToken() can only be called in the browser."
    );
  }
  await msalReady;
  let accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    console.warn("No accounts found. Attempting interactive login...");
    await msalInstance.loginPopup(loginRequest);
    accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error("Login failed. No account returned.");
    }
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      account: accounts[0],
      scopes: loginRequest.scopes,
    });
    return response.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      const response = await msalInstance.acquireTokenPopup({
        account: accounts[0],
        scopes: loginRequest.scopes,
      });
      return response.accessToken;
    }
    throw error;
  }
};
