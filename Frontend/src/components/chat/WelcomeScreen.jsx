import GenieLogo from '@/components/ui/GenieLogo';
import Suggestions from './Suggestions';
import styles from './WelcomeScreen.module.css';

// Empty-chat landing: greeting, the composer (passed in) and starter questions.
export default function WelcomeScreen({ firstName, composer, onPickSuggestion, busy }) {
  return (
    <div className={styles.screen}>
      <div className={styles.welcome}>
        <div className={styles.logo}>
          <GenieLogo size={44} />
        </div>
        <p className={styles.eyebrow}>{firstName ? `Hi ${firstName}` : 'Welcome to Genie'}</p>
        <h1 className={styles.greeting}>What would you like to explore today?</h1>
        <p className={styles.subtitle}>
          Ask questions about your data in plain language and get answers, tables and charts back.
        </p>
        <div className={styles.composer}>{composer}</div>
        <div className={styles.suggestionsLabel}>Try asking</div>
        <Suggestions onPick={onPickSuggestion} disabled={busy} />
      </div>
    </div>
  );
}
