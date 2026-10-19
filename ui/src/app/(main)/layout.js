import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/auth/app-utilities.css";
import AuthProvider from "@/auth/AuthProvider";
import ProtectedRoute from "@/auth/ProtectedRoute";

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
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
