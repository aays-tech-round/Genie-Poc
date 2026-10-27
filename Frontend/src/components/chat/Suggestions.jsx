import { SUGGESTED_QUESTIONS } from '@/constants/suggestions';
import { ChartColumn, FileText, Sparkles, Target, TrendingUp, TriangleAlert } from 'lucide-react';

const SUGGESTION_ICONS = {
  warning: TriangleAlert,
  trend: TrendingUp,
  sparkles: Sparkles,
  target: Target,
  chart: ChartColumn,
  document: FileText,
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
            className="group flex animate-rise items-center gap-[0.7rem] rounded-xl border border-line bg-main px-[0.85rem] py-[0.7rem] text-left text-secondary shadow-sm transition duration-250 ease-smooth enabled:hover:-translate-y-0.5 enabled:hover:border-accent enabled:hover:text-primary enabled:hover:shadow-md enabled:active:translate-y-0 enabled:active:scale-99 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ animationDelay: `${180 + i * 60}ms` }}
            onClick={() => onPick(q.text)}
            disabled={disabled}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent transition duration-250 ease-smooth group-enabled:group-hover:scale-106">
              <Icon size={16} />
            </span>
            <span className="text-sm leading-[1.4]">{q.text}</span>
          </button>
        );
      })}
    </div>
  );
}
