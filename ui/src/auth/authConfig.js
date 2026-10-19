import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

// Ported from App-Frontend/src/auth/authConfig.jsx (via teams-sso-module).
// Same MSAL settings; env vars use Next.js' NEXT_PUBLIC_ prefix so they are
// inlined into the browser bundle. They must be referenced literally.

const clientId = process.env.NEXT_PUBLIC_SSO_CLIENT_ID;
const authority = process.env.NEXT_PUBLIC_SSO_AUTHORITIES;
const knownAuthority = process.env.NEXT_PUBLIC_SSO_KNOWN_AUTHORITIES;
const apiScope = process.env.NEXT_PUBLIC_SSO_API_SCOPE;

// Without an authority MSAL silently falls back to the multi-tenant
// "common" endpoint, so a missing value must block login instead.
export const missingConfig = [
  !clientId && "NEXT_PUBLIC_SSO_CLIENT_ID",
  !authority && "NEXT_PUBLIC_SSO_AUTHORITIES",
  !apiScope && "NEXT_PUBLIC_SSO_API_SCOPE",
].filter(Boolean);

// Next.js also evaluates client modules on the server during prerender/SSR,
// where there is no window. MSAL is only created in the browser.
const isBrowser = typeof window !== "undefined";

export const msalConfig = {
  auth: {
    clientId,
    authority,
    knownAuthorities: knownAuthority ? [knownAuthority] : [],
    redirectUri: isBrowser ? window.location.origin : undefined,
    postLogoutRedirectUri: isBrowser ? window.location.origin : undefined,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true,
  },
};

export const loginRequest = {
  scopes: apiScope ? [apiScope] : [],
};

// null on the server, and when required config is missing (an unconfigured
// instance can fail to initialize, leaving the app stuck on "Loading…" instead
// of reaching /login, which explains what is missing). AuthProvider renders
// without MsalProvider in that case, so every user is treated as signed out.
export const msalInstance =
  isBrowser && missingConfig.length === 0 ? new PublicClientApplication(msalConfig) : null;

// Ensure initialized BEFORE any call.
export const msalReady = msalInstance ? msalInstance.initialize() : Promise.resolve();

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
