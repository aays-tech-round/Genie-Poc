import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { GenieMark } from "@/components/ui/GenieLogo";
import { loginRequest, missingConfig } from "./authConfig";
import { getAuthErrorMessage } from "./authErrors";
import styles from "./LoginPage.module.css";

// Served from public/auth/. Replace the file to use the official artwork.
const databricksLogo = "/auth/databricks-logo.svg";

// Data-graph layout for the showcase visualization (SVG viewBox 560 x 400).
const HUB = { x: 290, y: 200 };
const NODES = [
  { x: 70, y: 150, r: 5 },
  { x: 120, y: 290, r: 6, pulse: true },
  { x: 175, y: 95, r: 4 },
  { x: 230, y: 340, r: 4 },
  { x: 330, y: 60, r: 5, pulse: true },
  { x: 410, y: 120, r: 4 },
  { x: 470, y: 230, r: 6 },
  { x: 395, y: 330, r: 5, pulse: true },
  { x: 515, y: 345, r: 4 },
  { x: 505, y: 70, r: 3.5 },
];
// Pairs of NODES indexes linked to each other (every node also links to the hub).
const LINKS = [
  [0, 2],
  [0, 1],
  [1, 3],
  [2, 4],
  [4, 5],
  [5, 9],
  [5, 6],
  [6, 8],
  [6, 7],
  [7, 3],
];

// Slightly bowed curve between two points, so edges read as flowing lines.
const curve = (a, b, bend = 0.18) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx - (b.y - a.y) * bend;
  const cy = my + (b.x - a.x) * bend;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
};

// Brand logo (Microsoft's own artwork), so it stays an inline SVG rather than lucide-react.
const MicrosoftLogo = () => (
  <svg className={styles.msLogo} viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

// Genie lamp whose star twinkles on this page.
const GenieIcon = ({ className }) => (
  <GenieMark className={className} starClassName={styles.genieStar} />
);

const DataVisual = () => (
  <div className={styles.stage} aria-hidden="true">
   <div className={styles.stageInner}>
    <svg className={styles.graph} viewBox="0 0 560 400" role="presentation">
      <defs>
        <linearGradient id="loginFlowGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="loginNodeGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <radialGradient id="loginHubGlow">
          <stop offset="0%" stopColor="#7c5cff" stopOpacity=".35" />
          <stop offset="60%" stopColor="#5b6cff" stopOpacity=".1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Static edges */}
      {NODES.map((n, i) => (
        <path key={`e-h-${i}`} className={styles.edge} d={curve(n, HUB, i % 2 ? 0.14 : -0.14)} />
      ))}
      {LINKS.map(([a, b]) => (
        <path key={`e-${a}-${b}`} className={styles.edge} d={curve(NODES[a], NODES[b], 0.1)} />
      ))}

      {/* Animated data flowing into the hub */}
      {NODES.map((n, i) => (
        <path
          key={`f-${i}`}
          className={`${styles.flow} ${i % 3 === 0 ? styles.flowSlow : ""} ${i % 4 === 1 ? styles.flowReverse : ""}`}
          d={curve(n, HUB, i % 2 ? 0.14 : -0.14)}
        />
      ))}

      {/* Hub */}
      <circle className={styles.hubHalo} cx={HUB.x} cy={HUB.y} r="90" />
      <circle className={styles.hubRing} cx={HUB.x} cy={HUB.y} r="44" />
      <circle className={styles.hub} cx={HUB.x} cy={HUB.y} r="26" />
      <image href={databricksLogo} x={HUB.x - 15} y={HUB.y - 15} width="30" height="30" />

      {/* Nodes */}
      {NODES.map((n, i) => (
        <g key={`n-${i}`}>
          {n.pulse && (
            <circle
              className={styles.nodePulse}
              cx={n.x}
              cy={n.y}
              r={n.r + 4}
              style={{ animationDelay: `${i * 0.6}s` }}
            />
          )}
          <circle className={styles.node} cx={n.x} cy={n.y} r={n.r + 3} />
          <circle className={styles.nodeCore} cx={n.x} cy={n.y} r={n.r - 1} />
        </g>
      ))}
    </svg>

    {/* Floating analytics elements */}
    <div className={`${styles.card} ${styles.cardKpi}`}>
      <span className={styles.cardLabel}>Revenue · QoQ</span>
      <div className={styles.cardMetric}>
        $4.82M <span className={styles.delta}>▲ 18.4%</span>
      </div>
      <svg className={styles.spark} viewBox="0 0 120 30" fill="none">
        <defs>
          <linearGradient id="loginSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c5cff" stopOpacity=".25" />
            <stop offset="100%" stopColor="#7c5cff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 24 L15 21 L30 23 L45 16 L60 18 L75 11 L90 13 L105 6 L120 4 L120 30 L0 30 Z" fill="url(#loginSparkFill)" />
        <path
          d="M0 24 L15 21 L30 23 L45 16 L60 18 L75 11 L90 13 L105 6 L120 4"
          stroke="url(#loginFlowGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>

    <div className={`${styles.card} ${styles.cardBars}`}>
      <span className={`${styles.cardLabel} ${styles.cardLabelGenie}`}>
        <GenieIcon className={styles.cardLabelIcon} />
        Generated by Genie
      </span>
      <code className={styles.sql}>
        <span className={styles.sqlKey}>SELECT</span> product,
        <br />
        &nbsp;&nbsp;<span className={styles.sqlFn}>SUM</span>(revenue)
        <br />
        <span className={styles.sqlKey}>FROM</span> sales.orders
        <br />
        <span className={styles.sqlKey}>GROUP BY</span> product
      </code>
      <span className={styles.sqlStatus}>
        <span className={styles.sqlDot} />
        Ran in 1.2s
      </span>
    </div>

    <div className={`${styles.card} ${styles.cardAsk}`}>
      <span className={`${styles.askAvatar} ${styles.askAvatarGenie}`}>
        <GenieIcon />
      </span>
      <p className={styles.askText}>
        Which products drove growth last quarter?
        <span className={styles.typing}>
          <span />
          <span />
          <span />
        </span>
      </p>
    </div>
   </div>
  </div>
);

const LoginPage = () => {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    missingConfig.length
      ? `Sign-in is not configured. Missing environment variables: ${missingConfig.join(", ")}`
      : ""
  );

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
  const disabled = loading || notConfigured;
  const year = new Date().getFullYear();

  const buttonClass = [
    styles.ssoButton,
    loading ? styles.ssoButtonBusy : "",
    notConfigured ? styles.ssoButtonBlocked : "",
  ].join(" ");

  return (
    <div className={styles.page}>
      {/* Showcase */}
      <section className={styles.showcase} aria-label="Genie AI Workspace">
        <div className={styles.brand}>
          <span className={styles.dbLockup}>
            <img className={styles.brandMark} src={databricksLogo} alt="" />
            <span className={styles.dbWordmark}>databricks</span>
          </span>
          <span className={styles.brandDivider} aria-hidden="true" />
          <span className={styles.brandProduct}>
            <GenieIcon className={styles.brandGenie} />
            Genie AI Workspace
          </span>
        </div>

        <div>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            AI/BI Genie on your lakehouse
          </span>
          <h2 className={styles.headline}>
            Turn your data into <span className={styles.headlineAccent}>answers.</span>
          </h2>
          <p className={styles.lede}>
            Ask business questions in plain English. Genie understands your data, writes and runs
            the SQL on Databricks, and returns answers, tables and charts in seconds.
          </p>
        </div>

        <DataVisual />

        <ol className={styles.steps}>
          <li>
            <span className={styles.stepNum}>1</span>
            Ask a question
          </li>
          <li>
            <span className={styles.stepNum}>2</span>
            Genie writes the SQL
          </li>
          <li>
            <span className={styles.stepNum}>3</span>
            Get trusted answers
          </li>
        </ol>
      </section>

      {/* Sign-in */}
      <main className={styles.panel}>
        <div className={styles.panelInner}>
          <span className={styles.logo}>
            <img src={databricksLogo} alt="Databricks" />
            <span className={styles.logoBadge}>
              <GenieIcon />
            </span>
          </span>

          <p className={styles.welcome}>Welcome back</p>
          <h1 className={styles.title}>Sign in to your workspace</h1>
          <p className={styles.subtitle}>
            Use your organization&apos;s Microsoft account to start asking questions of your
            Databricks data with Genie.
          </p>

          {error && (
            <div role="alert" className={styles.alert}>
              <CircleAlert />
              <div>
                <span className={styles.alertTitle}>
                  {notConfigured ? "Sign-in unavailable" : "Couldn’t sign you in"}
                </span>
                <p className={styles.alertBody}>{error}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={loginBtn}
            disabled={disabled}
            aria-busy={loading}
            aria-describedby="login-secure-note"
            className={buttonClass}
          >
            {loading ? <span className={styles.spinner} aria-hidden="true" /> : <MicrosoftLogo />}
            <span>{loading ? "Signing in…" : "Continue with Microsoft"}</span>
          </button>

          <p className={styles.hint} aria-live="polite">
            {loading ? "Complete sign-in in the Microsoft window." : ""}
          </p>

          <div className={styles.divider} />

          <p id="login-secure-note" className={styles.secure}>
            <ShieldCheck />
            Secure authentication through your organization
          </p>
        </div>

        <footer className={styles.footer}>
          <span>© {year} Genie AI Workspace · Built on Databricks</span>
          <span>Single sign-on via Microsoft Entra ID</span>
        </footer>
      </main>
    </div>
  );
};

export default LoginPage;
