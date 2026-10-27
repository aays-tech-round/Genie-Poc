import { CornerDownRight } from 'lucide-react';
import styles from './FollowUps.module.css';

// Genie's suggested next questions under the latest answer; clicking one asks it.
export default function FollowUps({ questions, onAsk, disabled }) {
  if (!questions?.length) return null;

  return (
    <div className={styles.followUps}>
      <div className={styles.label}>Related questions</div>
      {questions.map((q, i) => (
        <button
          key={q}
          type="button"
          className={styles.chip}
          style={{ animationDelay: `${i * 60}ms` }}
          onClick={() => onAsk(q)}
          disabled={disabled}
        >
          <CornerDownRight size={14} className={styles.icon} />
          <span>{q}</span>
        </button>
      ))}
    </div>
  );
}
