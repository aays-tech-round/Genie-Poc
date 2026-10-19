import { useMsal } from "@azure/msal-react";

// Signed-in user's details, read the same way as App-Frontend/src/auth/Getusers.jsx.
export const useCurrentUser = () => {
  const { accounts } = useMsal();
  const account = accounts && accounts.length > 0 ? accounts[0] : null;

  return {
    account,
    name: account?.name || "",
    email: account?.username || "", // Usually the user's email
  };
};

export default useCurrentUser;
