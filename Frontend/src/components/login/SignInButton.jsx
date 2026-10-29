import Spinner from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';
import MicrosoftLogo from './MicrosoftLogo';

// "Continue with Microsoft" button. Greyed out when sign-in isn't configured;
// shows a spinner while the Microsoft popup is open.
export default function SignInButton({ loading, notConfigured, onClick, describedBy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || notConfigured}
      aria-busy={loading}
      aria-describedby={describedBy}
      className={cn(
        'relative isolate inline-flex min-h-[50px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl px-5 text-[15px] font-[550] tracking-[-0.005em] text-main transition-[translate,box-shadow,background-color] duration-[0.18s,0.25s,0.2s] focus-visible:outline-none disabled:cursor-not-allowed',
        notConfigured
          ? 'bg-line text-secondary'
          : cn(
              'shadow-lg',
              'focus-visible:ring-3 focus-visible:ring-accent-soft',
              loading
                ? 'cursor-progress! bg-secondary'
                : 'bg-primary enabled:hover:-translate-y-px enabled:hover:shadow-md enabled:active:translate-y-0'
            )
      )}
    >
      {loading ? (
        // Keeps turning (slower) even with reduced motion, so the wait still reads as progress
        <Spinner
          tone="inverse"
          className="size-[18px] flex-none motion-reduce:animate-[spin_1.6s_linear_infinite]!"
          aria-hidden="true"
        />
      ) : (
        <MicrosoftLogo className={cn('size-5 flex-none', notConfigured && 'opacity-60 grayscale')} />
      )}
      <span>{loading ? 'Signing in…' : 'Continue with Microsoft'}</span>
    </button>
  );
}
