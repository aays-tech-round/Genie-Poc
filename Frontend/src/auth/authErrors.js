import { BrowserAuthError, BrowserAuthErrorCodes } from "@azure/msal-browser";

// Turns MSAL / Entra ID errors into messages for the login screen.
export const getAuthErrorMessage = (error) => {
  if (!error) return "";

  if (error instanceof BrowserAuthError) {
    switch (error.errorCode) {
      case BrowserAuthErrorCodes.userCancelled:
        return "Sign-in was cancelled. Please try again.";
      case BrowserAuthErrorCodes.popupWindowError:
      case BrowserAuthErrorCodes.emptyWindowError:
        return "The sign-in window could not be opened. Please allow pop-ups for this site and try again.";
      case BrowserAuthErrorCodes.interactionInProgress:
        return "A sign-in is already in progress. Please complete or close it first.";
      case BrowserAuthErrorCodes.monitorPopupTimeout:
        return "Sign-in timed out. Please try again.";
      default:
        break;
    }
  }

  const message = error.errorMessage || error.message || "";

  // Entra ID server errors carry an AADSTS code, e.g. AADSTS50105.
  const aadsts = message.match(/AADSTS\d+/);
  if (aadsts) {
    if (aadsts[0] === "AADSTS50105") {
      return "Your account has not been granted access to this application. Please contact your administrator.";
    }
    if (aadsts[0] === "AADSTS65001") {
      return "Consent is required for this application. Please contact your administrator.";
    }
    if (aadsts[0] === "AADSTS50011") {
      return "This application's redirect URI is not registered. Please contact your administrator.";
    }
    return `Sign-in failed (${aadsts[0]}). Please try again or contact your administrator.`;
  }

  return "Sign-in failed. Please try again.";
};
