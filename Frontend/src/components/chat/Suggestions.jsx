import { SUGGESTED_QUESTIONS } from '@/constants/suggestions';
import { ChartColumn, FileText, Sparkles, Target, TrendingUp, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const SUGGESTION_ICONS = {
  warning: TriangleAlert,
  trend: TrendingUp,
  sparkles: Sparkles,
  target: Target,
  chart: ChartColumn,
  document: FileText,
};

// Badge tones: --tone tints the background, --tone-ink colours the icon
// (darker in light mode, lighter in dark mode, for contrast on each).
const TONES = {
  violet: '[--tone:#8f7edd] [--tone-ink:#6b5bc9] dark:[--tone-ink:#b6abf7]',
  blue: '[--tone:#4fa8d8] [--tone-ink:#2a7fb0] dark:[--tone-ink:#8fd3f0]',
  teal: '[--tone:#1baf7a] [--tone-ink:#0f8a5f] dark:[--tone-ink:#5fd4ab]',
  amber: '[--tone:#eda100] [--tone-ink:#a96d00] dark:[--tone-ink:#f5c35a]',
  rose: '[--tone:#e87ba4] [--tone-ink:#c2457a] dark:[--tone-ink:#f4a6c4]',
};

// Grid of starter questions for an empty chat; picking one asks Genie straight away.
export default function Suggestions({ onPick, disabled, questions = SUGGESTED_QUESTIONS }) {
  return (
    <div className="grid w-full grid-cols-2 gap-[0.6rem] max-[560px]:grid-cols-1 max-[560px]:gap-2" aria-label="Suggested questions">
      {questions.map((q, i) => {
        const Icon = SUGGESTION_ICONS[q.icon] || Sparkles;
        return (
          <button
            key={q.text}
            type="button"
            className="group flex animate-rise items-center gap-[0.7rem] rounded-xl border border-line bg-elevated px-[0.85rem] py-[0.7rem] text-left text-secondary shadow-sm transition duration-250 ease-smooth enabled:hover:-translate-y-0.5 enabled:hover:border-accent-ring enabled:hover:bg-[linear-gradient(180deg,var(--accent-softer),transparent_70%)] enabled:hover:text-primary enabled:hover:shadow-md enabled:active:translate-y-0 enabled:active:scale-99 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ animationDelay: `${180 + i * 60}ms` }}
            onClick={() => onPick(q.text)}
            disabled={disabled}
          >
            <span
              className={cn(
                'inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-linear-135 from-(color:--tone)/22 to-(color:--tone)/8 text-(color:--tone-ink) ring-1 ring-(color:--tone)/28 ring-inset transition duration-250 ease-smooth',
                'group-enabled:group-hover:scale-106 group-enabled:group-hover:from-(color:--tone)/32 group-enabled:group-hover:to-(color:--tone)/14 group-enabled:group-hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--tone)_25%,transparent)] group-enabled:group-hover:ring-(color:--tone)/40',
                TONES[q.tone] || TONES.violet
              )}
            >
              <Icon size={16} />
            </span>
            <span className="text-sm leading-[1.4]">{q.text}</span>
          </button>
        );
      })}
    </div>
  );
}
