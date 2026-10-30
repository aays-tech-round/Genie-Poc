import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { ShieldCheck } from "lucide-react";
import LoginError from "@/components/login/LoginError";
import Showcase from "@/components/login/Showcase";
import SignInButton from "@/components/login/SignInButton";
import { GenieMark } from "@/components/ui/GenieLogo";
import { databricksLogo } from "@/components/login/assets";
import { loginRequest, missingConfig, missingConfigMessage } from "./authConfig";
import { getAuthErrorMessage } from "./authErrors";

const LoginPage = () => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(missingConfig.length ? missingConfigMessage : "");

  const alreadySignedIn = isAuthenticated && !loading;

  useEffect(() => {
    if (alreadySignedIn) window.location.replace("/");
  }, [alreadySignedIn]);

  if (alreadySignedIn) {
    return null;
  }

  const loginBtn = async () => {
    if (missingConfig.length) return;
    setError("");
    setLoading(true);
    try {
      const loginResponse = await instance.loginPopup(loginRequest);
      if (!loginResponse?.account) {
        throw new Error("Login failed. No account returned.");
      }
      instance.setActiveAccount(loginResponse.account);
      window.location.replace("/");
    } catch (err) {
      console.error("Login failed", err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const notConfigured = missingConfig.length > 0;
  const year = new Date().getFullYear();

  return (
    // Desktop: two columns, exactly one screen tall. Tablet: stacked and scrolling.
    // Phone: the showcase is dropped and the sign-in panel leads.
    <div className="grid h-dvh grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] overflow-hidden bg-main text-primary antialiased max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto">
      <Showcase />

      {/* Sign-in */}
      <main className="flex min-h-0 min-w-0 flex-col overflow-y-auto bg-main px-[clamp(24px,5vw,72px)] py-8 max-[900px]:overflow-visible max-[900px]:px-8 max-[900px]:pt-10 max-[900px]:pb-7 max-sm:min-h-dvh max-sm:bg-[radial-gradient(90%_40%_at_0%_0%,var(--accent-soft),transparent_70%),radial-gradient(80%_35%_at_100%_100%,var(--accent-soft),transparent_70%)] max-sm:px-4 max-sm:pt-6 max-sm:pb-5">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 animate-[panelRise_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both] flex-col justify-center max-[900px]:flex-none max-sm:flex-1">
          <span className="relative mb-7 grid size-14 place-items-center rounded-[15px] border border-line bg-main shadow-md ring-6 ring-accent-soft max-sm:mb-[22px] max-sm:size-[52px]">
            <img className="size-[30px]" src={databricksLogo} alt="Databricks" />
            {/* Genie sparkle tucked onto the corner of the Databricks tile */}
            <span className="absolute -right-2 -bottom-2 grid size-[26px] place-items-center rounded-lg border border-line bg-main shadow-md">
              <GenieMark className="size-5" />
            </span>
          </span>

          <p className="mb-2 text-[13px] font-semibold tracking-[0.01em] text-accent">
            Welcome back
          </p>
          <h1 className="text-[length:clamp(26px,2.4vw,30px)] leading-[1.2] font-[650] tracking-[-0.025em] text-primary">
            Sign in to your workspace
          </h1>
          <p className="mt-2.5 mb-8 text-[15px] leading-[1.6] text-secondary">
            Use your organization&apos;s Microsoft account to start asking questions of your
            Databricks data with Genie.
          </p>

          {error && (
            <LoginError
              title={notConfigured ? "Sign-in unavailable" : "Couldn’t sign you in"}
              message={error}
            />
          )}

          <SignInButton
            loading={loading}
            notConfigured={notConfigured}
            onClick={loginBtn}
            describedBy="login-secure-note"
          />

          <p className="mt-3 min-h-5 text-center text-[13px] text-secondary" aria-live="polite">
            {loading ? "Complete sign-in in the Microsoft window." : ""}
          </p>

          <div className="mt-7 mb-5 h-px bg-[linear-gradient(90deg,transparent,var(--line)_20%,var(--line)_80%,transparent)]" />

          <p id="login-secure-note" className="flex items-center justify-center gap-2 text-[13px] text-secondary">
            <ShieldCheck className="size-[15px] flex-none text-success" />
            Secure authentication through your organization
          </p>
        </div>

        <footer className="mx-auto mt-6 flex w-full max-w-[400px] flex-wrap justify-between gap-2 text-xs text-secondary max-sm:justify-center max-sm:text-center">
          <span>© {year} Genie AI Workspace · Built on Databricks</span>
          <span>Single sign-on via Microsoft Entra ID</span>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
