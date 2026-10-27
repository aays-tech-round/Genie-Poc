import { CornerDownRight } from 'lucide-react';

// Genie's suggested next questions under the latest answer; clicking one asks it.
export default function FollowUps({ questions, onAsk, disabled }) {
  if (!questions?.length) return null;

  return (
    <div className="mt-4 flex flex-col items-start gap-[0.4rem]">
      <div className="mb-[0.1rem] text-xs font-semibold tracking-[0.04em] text-tertiary uppercase">
        Related questions
      </div>
      {questions.map((q, i) => (
        <button
          key={q}
          type="button"
          className="inline-flex max-w-full animate-[riseIn_0.4s_var(--ease-smooth)_both] items-start gap-2 rounded-xl border border-line bg-elevated py-[0.45rem] pr-[0.8rem] pl-[0.65rem] text-left text-[0.85rem] leading-[1.45] text-secondary transition duration-200 enabled:hover:translate-x-0.5 enabled:hover:border-accent-ring enabled:hover:text-primary enabled:hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          style={{ animationDelay: `${i * 60}ms` }}
          onClick={() => onAsk(q)}
          disabled={disabled}
        >
          <CornerDownRight size={14} className="mt-[0.15rem] shrink-0 text-accent-strong" />
          <span>{q}</span>
        </button>
      ))}
    </div>
  );
}
