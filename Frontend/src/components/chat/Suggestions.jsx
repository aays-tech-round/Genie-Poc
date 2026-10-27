import { SUGGESTED_QUESTIONS } from '@/constants/suggestions';
import { ChartColumn, FileText, Sparkles, Target, TrendingUp, TriangleAlert } from 'lucide-react';
import styles from './Suggestions.module.css';

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
    <div className={styles.grid} aria-label="Suggested questions">
      {questions.map((q, i) => {
        const Icon = SUGGESTION_ICONS[q.icon] || Sparkles;
        return (
          <button
            key={q.text}
            type="button"
            className={styles.card}
            style={{ animationDelay: `${180 + i * 60}ms` }}
            onClick={() => onPick(q.text)}
            disabled={disabled}
          >
            <span className={`${styles.icon} ${styles[q.tone] || styles.violet}`}><Icon size={16} /></span>
            <span className={styles.text}>{q.text}</span>
          </button>
        );
      })}
    </div>
  );
}
