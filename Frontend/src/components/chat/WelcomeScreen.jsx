import GenieLogo from '@/components/ui/GenieLogo';
import Suggestions from './Suggestions';

// Empty-chat landing: greeting, the composer (passed in) and starter questions.
// Each part rises in a moment after the one above it.
export default function WelcomeScreen({ firstName, composer, onPickSuggestion, busy }) {
  return (
    <div className="relative flex min-h-0 flex-1 justify-center overflow-y-auto scrollbar-thin px-5">
      <div className="my-auto flex w-full max-w-[760px] flex-col items-center pt-6 pb-8 max-md:pt-4 max-md:pb-6">
        <div className="mb-[0.9rem] animate-[logoIn_0.6s_var(--ease-smooth)_both] rounded-[13px] leading-0 shadow-md max-md:[&_svg]:size-10">
          <GenieLogo size={44} />
        </div>
        <p className="mb-[0.4rem] animate-rise text-[0.95rem] font-semibold text-accent [animation-delay:0.05s]">
          {firstName ? `Hi ${firstName}` : 'Welcome to Genie'}
        </p>
        <h1 className="animate-rise text-center text-[1.85rem] leading-[1.2] font-semibold tracking-[-0.025em] text-primary [animation-delay:0.08s] max-md:text-[1.5rem]">
          What would you like to explore today?
        </h1>
        <p className="mt-[0.6rem] max-w-[520px] animate-rise text-center text-[0.975rem] leading-[1.6] text-secondary [animation-delay:0.11s] max-md:text-[0.9rem]">
          Ask questions about your data in plain language and get answers, tables and charts back.
        </p>
        <div className="mt-6 w-full animate-rise [animation-delay:0.14s] max-md:mt-5">{composer}</div>
        <div className="mt-6 mb-[0.6rem] ml-[0.15rem] animate-[fadeOnly_0.5s_ease_0.18s_both] self-start text-xs font-semibold tracking-[0.06em] text-secondary uppercase max-md:mt-5">
          Try asking
        </div>
        <Suggestions onPick={onPickSuggestion} disabled={busy} />
      </div>
    </div>
  );
}
