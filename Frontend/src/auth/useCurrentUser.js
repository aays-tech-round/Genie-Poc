import { useMsal } from "@azure/msal-react";

// Signed-in user's name and email, from the first MSAL account.
export const useCurrentUser = () => {
  const { accounts } = useMsal();
  const account = accounts && accounts.length > 0 ? accounts[0] : null;

  return {
    name: account?.name || "",
    email: account?.username || "", // Usually the user's email
  };
};
