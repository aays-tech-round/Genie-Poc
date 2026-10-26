import { useState } from "react";
import { useMsal } from "@azure/msal-react";

// Logout control + confirmation modal from App-Frontend/src/nav/Header.jsx.
// The lucide-react LogOut icon is inlined so the module doesn't need that package.
const LogOutIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="align-middle"
    aria-hidden="true"
  >
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </svg>
);

const LogoutButton = ({ className = "" }) => {
  const { instance } = useMsal();
  const [openModal, setOpenModal] = useState(false);

  // Ends the Entra ID session and returns to postLogoutRedirectUri (the app origin).
  const handleLogout = () => {
    instance.logoutRedirect();
  };

  return (
    <>
      <button
        onClick={() => setOpenModal(true)}
        className={`flex items-center gap-2 px-4 py-2 text-sm leading-none cursor-pointer ${className}`}
      >
        <LogOutIcon />
        <span className="cursor-pointer">Logout</span>
      </button>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-lg w-96 max-w-[calc(100%-2rem)] p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Are you sure you want to logout?</h2>
            <p className="text-sm text-gray-600 mb-6">Please confirm your decision.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="px-4 py-2 cursor-pointer text-sm border rounded-md hover:bg-gray-100"
              >
                No
              </button>
              <button
                onClick={handleLogout}
                className="px-4 cursor-pointer py-2 text-sm bg-[#0078D4] text-white rounded-md"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
