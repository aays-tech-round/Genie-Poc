import DataVisual from './DataVisual';
import TwinklingGenieIcon from './TwinklingGenieIcon';
import { databricksLogo } from './assets';

const STEPS = ['Ask a question', 'Genie writes the SQL', 'Get trusted answers'];

// Left column of the login page: branding, pitch, data visual and the three steps.
// Its ::before is a faint dot grid, fading out toward the edges. Hidden on phones.
export default function Showcase() {
  return (
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
          <TwinklingGenieIcon className="size-[22px] flex-none" />
          Genie AI Workspace
        </span>
      </div>

      <div>
        <span className="mb-[18px] inline-flex items-center gap-2 rounded-full border border-accent-soft bg-main py-[5px] pr-3 pl-2 text-[12.5px] font-medium text-secondary backdrop-blur-[6px]">
          <span className="size-[7px] rounded-full bg-accent ring-3 ring-accent-soft" />
          AI/BI Genie on your lakehouse
        </span>
        <h2 className="text-[length:clamp(30px,min(3.4vw,5.4vh),50px)] leading-[1.05] font-[650] tracking-[-0.035em] text-primary">
          Turn your data into <span className="text-accent">answers.</span>
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
  );
}
