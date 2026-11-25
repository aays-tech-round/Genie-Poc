import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";


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
    storeAuthStateInCookie: true,
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

// Access token for the protected API: silent first, popup if interaction is required.
export const getToken = async () => {
  if (!msalInstance) {
    throw new Error(
      missingConfig.length ? missingConfigMessage : "getToken() can only be called in the browser."
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
