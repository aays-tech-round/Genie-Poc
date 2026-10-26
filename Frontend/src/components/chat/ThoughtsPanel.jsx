import { useEffect, useState } from 'react';
import { GENIE_STEPS, THOUGHT_LABELS } from '@/constants/genie';
import {
  CheckIcon, ChevronDownIcon, CodeIcon, CopyIcon, DatabaseIcon, LightbulbIcon,
} from '@/components/ui/icons';
import Markdown from '@/components/ui/Markdown';
import styles from './ThoughtsPanel.module.css';

// Live progress text: the backend's status message, or a generic line before Genie reports one.
const progressText = (message) =>
  ['SUBMITTED', 'STARTING', 'PENDING', undefined].includes(message.status) || !message.status_message
    ? 'Genie is thinking…'
    : message.status_message.replace(/\.\.\.$/, '…');

export const hasInsights = (m) =>
  Boolean(m.steps?.length || m.thoughts?.length || m.sql);

function SqlBlock({ sql, parameters }) {
  const [copied, setCopied] = useState(false);
  const text = sql.replace(/\r\n?/g, '\n').trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context): the SQL is still selectable
    }
  };

  return (
    <div className={styles.sql}>
      <div className={styles.sqlHeader}>
        <span className={styles.sectionTitle}><CodeIcon size={14} /> Generated SQL</span>
        <button type="button" className={styles.copyBtn} onClick={copy} aria-label="Copy SQL">
          {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {parameters?.length > 0 && (
        <div className={styles.params}>
          {parameters.map((p) => (
            <span key={p.keyword} className={styles.param} title={p.sql_type || undefined}>
              <span className={styles.paramKey}>:{p.keyword}</span> = {String(p.value)}
            </span>
          ))}
        </div>
      )}
      <pre className={styles.code}><code>{text}</code></pre>
    </div>
  );
}

/**
 * How Genie got to an answer: progress steps, its thoughts and the SQL it ran.
 * While `live` it is open and shows the current step; once the answer arrives it
 * collapses to a one-line summary the user can expand.
 */
export default function ThoughtsPanel({ message, live }) {
  const [open, setOpen] = useState(live);
  const steps = message.steps || [];
  const thoughts = message.thoughts || [];

  // Fold away when the answer lands (the bubble stays mounted across that change)
  useEffect(() => {
    if (!live) setOpen(false);
  }, [live]);

  const hasBody = steps.length > 0 || thoughts.length > 0 || Boolean(message.sql);
  const summary = [
    steps.length && `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`,
    message.sql && 'SQL',
  ].filter(Boolean).join(' · ');

  return (
    <div className={`${styles.panel} ${live ? styles.live : ''}`}>
      <button
        type="button"
        className={styles.header}
        onClick={() => hasBody && setOpen((o) => !o)}
        aria-expanded={hasBody ? open : undefined}
        disabled={!hasBody}
      >
        {live ? (
          <>
            <span className={styles.typing} aria-hidden="true">
              <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
            </span>
            {/* key restarts the fade each time the step changes */}
            <span key={progressText(message)} className={styles.liveText} role="status" aria-live="polite">
              {progressText(message)}
            </span>
          </>
        ) : (
          <>
            <LightbulbIcon size={15} className={styles.headerIcon} />
            <span className={styles.headerTitle}>Thoughts</span>
            {summary && <span className={styles.headerMeta}>{summary}</span>}
          </>
        )}
        {hasBody && (
          <ChevronDownIcon size={15} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
        )}
      </button>

      {/* grid-template-rows 0fr -> 1fr animates the height without measuring it */}
      <div className={`${styles.collapse} ${open && hasBody ? styles.collapseOpen : ''}`}>
        <div className={styles.collapseInner}>
          <div className={styles.body}>
            {steps.length > 0 && (
              <ol className={styles.steps}>
                {steps.map((s, i) => {
                  const current = live && i === steps.length - 1;
                  return (
                    <li key={`${s}-${i}`} className={`${styles.step} ${current ? styles.stepCurrent : ''}`}>
                      <span className={styles.stepMarker} aria-hidden="true">
                        {current ? <span className={styles.spinner} /> : <CheckIcon size={11} />}
                      </span>
                      {current ? GENIE_STEPS[s].active : GENIE_STEPS[s].done}
                    </li>
                  );
                })}
              </ol>
            )}

            {(message.query_title || message.query_description) && (
              <div className={styles.section}>
                {message.query_title && <div className={styles.queryTitle}>{message.query_title}</div>}
                {message.query_description && <Markdown text={message.query_description} />}
              </div>
            )}

            {thoughts.map((t, i) => (
              <div key={i} className={styles.section}>
                <div className={styles.sectionTitle}>
                  {t.type === 'data_sourcing' ? <DatabaseIcon size={14} /> : <LightbulbIcon size={14} />}
                  {THOUGHT_LABELS[t.type] || 'Thought'}
                </div>
                <div className={styles.thought}><Markdown text={t.content} /></div>
              </div>
            ))}

            {message.sql && <SqlBlock sql={message.sql} parameters={message.sql_parameters} />}
          </div>
        </div>
      </div>
    </div>
  );
}
