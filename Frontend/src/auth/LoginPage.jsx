import { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { CircleAlert, ShieldCheck } from "lucide-react";
import { GenieMark } from "@/components/ui/GenieLogo";
import { cn } from "@/lib/utils";
import { loginRequest, missingConfig } from "./authConfig";
import { getAuthErrorMessage } from "./authErrors";

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

const STEPS = ["Ask a question", "Genie writes the SQL", "Get trusted answers"];

// Slightly bowed curve between two points, so edges read as flowing lines.
const curve = (a, b, bend = 0.18) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx - (b.y - a.y) * bend;
  const cy = my + (b.x - a.x) * bend;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
};

// Dashes streaming along an edge into the hub; every third is slower, every fourth runs backwards.
const flowAnimation = (i) =>
  [
    i % 3 === 0 ? "animate-[graphFlow_4.2s_linear_infinite]" : "animate-[graphFlow_2.8s_linear_infinite]",
    i % 4 === 1 && "[animation-direction:reverse]",
  ];

// Brand logo (Microsoft's own artwork), so it stays an inline SVG rather than lucide-react.
const MicrosoftLogo = ({ className }) => (
  <svg className={className} viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

// Genie lamp whose star twinkles on this page; only the star moves, the lamp stays put.
const GenieIcon = ({ className }) => (
  <GenieMark
    className={className}
    starClassName="origin-center transform-fill animate-[starTwinkle_2.4s_ease-in-out_infinite]"
  />
);

// Floating analytics card over the graph. Sizes use --u (one design pixel, set on the
// stage) so the cards scale with their % positions instead of overlapping on short screens.
const card =
  "absolute rounded-[calc(var(--u)*14)] border border-line bg-main px-[calc(var(--u)*14)] py-[calc(var(--u)*12)] shadow-lg backdrop-blur-[10px] backdrop-saturate-140 will-change-transform";
const cardLabel = "text-[length:calc(var(--u)*11)] font-medium tracking-[0.02em] text-secondary uppercase";

const DataVisual = () => (
  // Takes whatever height is left in the column; the visual inside scales to fit it,
  // so the left side never grows past the screen.
  <div
    className="grid min-h-0 flex-[1_1_0] place-items-center [container-type:size] max-[900px]:h-[clamp(220px,48vw,360px)] max-[900px]:max-w-[520px] max-[900px]:flex-none"
    aria-hidden="true"
  >
    {/* --u is resolved inside the cards, so 100cqw is this element's width: 1px at the full 620px */}
    <div className="relative aspect-[560/400] w-[min(100cqw,140cqh,620px)] [container-type:inline-size] [--u:calc(100cqw/620)]">
      <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 560 400" role="presentation">
        {/* Static edges */}
        {NODES.map((n, i) => (
          <path
            key={`e-h-${i}`}
            className="fill-none stroke-line stroke-[1.25]"
            d={curve(n, HUB, i % 2 ? 0.14 : -0.14)}
          />
        ))}
        {LINKS.map(([a, b]) => (
          <path
            key={`e-${a}-${b}`}
            className="fill-none stroke-line stroke-[1.25]"
            d={curve(NODES[a], NODES[b], 0.1)}
          />
        ))}

        {/* Animated data flowing into the hub */}
        {NODES.map((n, i) => (
          <path
            key={`f-${i}`}
            className={cn(
              "fill-none stroke-[1.75] stroke-accent [stroke-dasharray:3_14] [stroke-linecap:round]",
              ...flowAnimation(i)
            )}
            d={curve(n, HUB, i % 2 ? 0.14 : -0.14)}
          />
        ))}

        {/* Hub */}
        <circle
          className="origin-center transform-fill animate-[hubBreathe_5s_ease-in-out_infinite] fill-accent-soft"
          cx={HUB.x}
          cy={HUB.y}
          r="90"
        />
        <circle
          className="origin-center transform-fill animate-[spin_24s_linear_infinite] fill-none stroke-accent stroke-1 [stroke-dasharray:2_6]"
          cx={HUB.x}
          cy={HUB.y}
          r="44"
        />
        <circle
          className="fill-main stroke-accent stroke-[1.5] drop-shadow-md"
          cx={HUB.x}
          cy={HUB.y}
          r="26"
        />
        <image href={databricksLogo} x={HUB.x - 15} y={HUB.y - 15} width="30" height="30" />

        {/* Nodes */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            {n.pulse && (
              <circle
                className="origin-center transform-fill animate-[nodePulse_3.2s_ease-out_infinite] fill-accent-soft"
                cx={n.x}
                cy={n.y}
                r={n.r + 4}
                style={{ animationDelay: `${i * 0.6}s` }}
              />
            )}
            <circle className="fill-main stroke-accent stroke-[1.5]" cx={n.x} cy={n.y} r={n.r + 3} />
            <circle className="fill-accent" cx={n.x} cy={n.y} r={n.r - 1} />
          </g>
        ))}
      </svg>

      {/* Floating analytics elements */}
      <div className={cn(card, "top-[4%] left-0 animate-[cardFloat_7s_ease-in-out_infinite]")}>
        <span className={cn(cardLabel, "block")}>Revenue · QoQ</span>
        <div className="mt-[calc(var(--u)*4)] flex items-baseline gap-[calc(var(--u)*8)] text-[length:calc(var(--u)*20)] font-[650] tracking-[-0.02em] text-primary">
          $4.82M{" "}
          <span className="text-[length:calc(var(--u)*12)] font-semibold text-success">▲ 18.4%</span>
        </div>
        <svg
          className="mt-[calc(var(--u)*6)] block h-[calc(var(--u)*30)] w-[calc(var(--u)*120)]"
          viewBox="0 0 120 30"
          fill="none"
        >
          <path className="fill-accent-soft" d="M0 24 L15 21 L30 23 L45 16 L60 18 L75 11 L90 13 L105 6 L120 4 L120 30 L0 30 Z" />
          <path
            className="stroke-accent"
            d="M0 24 L15 21 L30 23 L45 16 L60 18 L75 11 L90 13 L105 6 L120 4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        className={cn(
          card,
          "top-[30%] -right-[2%] animate-[cardFloat_8s_ease-in-out_-2.5s_infinite] max-[1180px]:-right-[4%]"
        )}
      >
        <span className={cn(cardLabel, "inline-flex items-center gap-[calc(var(--u)*5)]")}>
          <GenieIcon className="size-[calc(var(--u)*16)] flex-none" />
          Generated by Genie
        </span>
        <code className="mt-[calc(var(--u)*8)] block [font-family:ui-monospace,'SF_Mono','Cascadia_Code',Consolas,monospace] text-[length:calc(var(--u)*11.5)] leading-[1.55] whitespace-nowrap text-secondary">
          <span className="font-semibold text-accent">SELECT</span> product,
          <br />
          &nbsp;&nbsp;<span className="text-success">SUM</span>(revenue)
          <br />
          <span className="font-semibold text-accent">FROM</span> sales.orders
          <br />
          <span className="font-semibold text-accent">GROUP BY</span> product
        </code>
        <span className="mt-[calc(var(--u)*8)] inline-flex items-center gap-[calc(var(--u)*6)] rounded-full bg-soft px-[calc(var(--u)*8)] py-[calc(var(--u)*2)] text-[length:calc(var(--u)*11)] font-medium text-success">
          <span className="size-[calc(var(--u)*6)] rounded-full bg-success" />
          Ran in 1.2s
        </span>
      </div>

      <div
        className={cn(
          card,
          "bottom-[2%] left-[8%] flex max-w-[calc(var(--u)*290)] animate-[cardFloat_9s_ease-in-out_-4.5s_infinite] items-center gap-[calc(var(--u)*10)]"
        )}
      >
        <span className="grid size-[calc(var(--u)*28)] flex-none place-items-center rounded-[calc(var(--u)*8)] border border-line bg-main">
          <GenieIcon className="size-[calc(var(--u)*22)]" />
        </span>
        <p className="text-[length:calc(var(--u)*13)] leading-[1.4] text-secondary">
          Which products drove growth last quarter?
          <span className="ml-[calc(var(--u)*4)] inline-flex gap-[calc(var(--u)*3)] align-middle">
            {[0, 0.15, 0.3].map((delay) => (
              <span
                key={delay}
                className="size-[calc(var(--u)*4)] animate-[typingBlink_1.2s_ease-in-out_infinite] rounded-full bg-accent"
                style={{ animationDelay: `${delay}s` }}
              />
            ))}
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

  return (
    // Desktop: two columns, exactly one screen tall. Tablet: stacked and scrolling.
    // Phone: the showcase is dropped and the sign-in panel leads.
    <div className="grid h-dvh grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] overflow-hidden bg-main text-primary antialiased max-[1180px]:grid-cols-2 max-[900px]:grid-cols-1 max-[900px]:overflow-y-auto">
      {/* Showcase. Its ::before is a faint dot grid, fading out toward the edges. */}
      <section
        className="relative isolate flex min-h-0 flex-col gap-[clamp(16px,3vh,28px)] overflow-hidden border-r border-line bg-soft bg-[radial-gradient(60%_50%_at_18%_12%,var(--accent-soft),transparent_70%),radial-gradient(55%_45%_at_85%_85%,var(--accent-soft),transparent_70%)] px-[clamp(32px,4.5vw,64px)] py-[clamp(24px,4vh,40px)] before:absolute before:inset-0 before:-z-1 before:bg-[radial-gradient(var(--line)_1px,transparent_1px)] before:bg-size-[22px_22px] before:[mask-image:radial-gradient(70%_70%_at_50%_50%,var(--primary)_30%,transparent_100%)] max-[900px]:gap-6 max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:px-8 max-[900px]:pt-8 max-[900px]:pb-7 max-sm:hidden"
        aria-label="Genie AI Workspace"
      >
        <div className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em] text-primary">
          <span className="inline-flex items-center gap-[7px]">
            <img className="block size-[26px] flex-none" src={databricksLogo} alt="" />
            <span className="text-[21px] leading-none font-semibold tracking-[-0.035em] text-primary">databricks</span>
          </span>
          <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5 font-medium text-secondary">
            <GenieIcon className="size-[22px] flex-none" />
            Genie AI Workspace
          </span>
        </div>

        <div>
          <span className="mb-[18px] inline-flex items-center gap-2 rounded-full border border-accent-soft bg-main py-[5px] pr-3 pl-2 text-[12.5px] font-medium text-secondary backdrop-blur-[6px]">
            <span className={"size-[7px] rounded-full bg-accent ring-3 ring-accent-soft"} />
            AI/BI Genie on your lakehouse
          </span>
          <h2 className="text-[length:clamp(30px,min(3.4vw,5.4vh),50px)] leading-[1.05] font-[650] tracking-[-0.035em] text-primary">
            Turn your data into{" "}
            <span className="text-accent">
              answers.
            </span>
          </h2>
          <p className="mt-[clamp(10px,2vh,18px)] max-w-[46ch] text-base leading-[1.6] text-secondary">
            Ask any question about your business data. Genie understands your data, writes and runs
            the SQL on Databricks, and returns answers, tables and charts in seconds.
          </p>
        </div>

        <DataVisual />

        <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] font-medium text-secondary max-[900px]:hidden">
          {STEPS.map((step, i) => (
            <li key={step} className="inline-flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] font-semibold text-main">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Sign-in */}
      <main className="flex min-h-0 min-w-0 flex-col overflow-y-auto bg-main px-[clamp(24px,5vw,72px)] py-8 max-[900px]:overflow-visible max-[900px]:px-8 max-[900px]:pt-10 max-[900px]:pb-7 max-sm:min-h-dvh max-sm:bg-[radial-gradient(90%_40%_at_0%_0%,var(--accent-soft),transparent_70%),radial-gradient(80%_35%_at_100%_100%,var(--accent-soft),transparent_70%)] max-sm:px-4 max-sm:pt-6 max-sm:pb-5">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 animate-[panelRise_0.6s_cubic-bezier(0.2,0.8,0.2,1)_both] flex-col justify-center max-[900px]:flex-none max-sm:flex-1">
          <span className="relative mb-7 grid size-14 place-items-center rounded-[15px] border border-line bg-main shadow-md ring-6 ring-accent-soft max-sm:mb-[22px] max-sm:size-[52px]">
            <img className="size-[30px]" src={databricksLogo} alt="Databricks" />
            {/* Genie sparkle tucked onto the corner of the Databricks tile */}
            <span className="absolute -right-2 -bottom-2 grid size-[26px] place-items-center rounded-lg border border-line bg-main shadow-md">
              <GenieIcon className="size-5" />
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
            <div
              role="alert"
              className="mb-4 flex animate-[panelRise_0.3s_ease-out_both] gap-2.5 rounded-[10px] border border-danger bg-main px-3.5 py-3 text-[13.5px] leading-normal text-danger"
            >
              <CircleAlert className="mt-px size-[18px] flex-none" />
              <div>
                <span className="mb-0.5 block font-semibold">
                  {notConfigured ? "Sign-in unavailable" : "Couldn’t sign you in"}
                </span>
                <p className="wrap-break-word text-danger">{error}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={loginBtn}
            disabled={disabled}
            aria-busy={loading}
            aria-describedby="login-secure-note"
            className={cn(
              "relative isolate inline-flex min-h-[50px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-5 text-[15px] font-[550] tracking-[-0.005em] text-main transition-[translate,box-shadow,background-color] duration-[0.18s,0.25s,0.2s] focus-visible:outline-none disabled:cursor-not-allowed",
              notConfigured
                ? "bg-line text-secondary"
                : cn(
                    "shadow-lg",
                    "focus-visible:ring-3 focus-visible:ring-accent-soft",
                    loading
                      ? "cursor-progress! bg-secondary"
                      : "bg-primary enabled:hover:-translate-y-px enabled:hover:shadow-md enabled:active:translate-y-0"
                  )
            )}
          >
            {loading ? (
              // Keeps turning (slower) even with reduced motion, so the wait still reads as progress
              <span
                className="size-[18px] flex-none animate-spinner rounded-full border-2 border-line border-t-main motion-reduce:animate-[spin_1.6s_linear_infinite]!"
                aria-hidden="true"
              />
            ) : (
              <MicrosoftLogo className={cn("size-5 flex-none", notConfigured && "opacity-60 grayscale")} />
            )}
            <span>{loading ? "Signing in…" : "Continue with Microsoft"}</span>
          </button>

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
