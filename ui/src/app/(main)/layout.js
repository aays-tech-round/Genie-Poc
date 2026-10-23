import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/auth/app-utilities.css";
import AuthProvider from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";
import { THEME_INIT_SCRIPT } from "@/constants/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Databricks Genie",
  description: "Chat with Databricks Genie",
  icons: { icon: "/genie-icon.svg" },
};

export default function RootLayout({ children }) {
  return (
    // data-theme is set by THEME_INIT_SCRIPT before hydration, so React must not compare it
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      {/* Browser extensions (e.g. ColorZilla) inject attributes on <body> */}
      <body suppressHydrationWarning>
        {/* Every route in (main), including "/", requires a signed-in user */}
        <AuthProvider>
          <ProtectedRoute>{children}</ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
}
