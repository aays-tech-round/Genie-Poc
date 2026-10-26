import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

// Each layout is lazy-loaded so a page only pulls in its own global CSS.
const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => ({ Component: (await import("./pages/MainLayout")).default }),
  },
  {
    path: "/login",
    lazy: async () => ({ Component: (await import("./pages/LoginLayout")).default }),
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
