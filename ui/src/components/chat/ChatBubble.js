"use client";

import React, { useState } from 'react';
import styles from './ChatBubble.module.css';
import { useCurrentUser } from '@/auth/useCurrentUser';
import { FAILED_STATUSES } from '@/constants/genie';
import { getInitials } from '@/lib/utils';
import { AlertIcon, GenieLogo, RetryIcon, ThumbsDownIcon, ThumbsUpIcon } from '@/components/ui/icons';
import Markdown from '@/components/ui/Markdown';
import ResultView from '@/components/results/ResultView';

// Progress text from the backend's STATUS_MESSAGES; the client-side placeholders
// ("Message Sent", or none while /ask is in flight) fall back to a generic line.
const progressText = (message) =>
  ['SUBMITTED', 'STARTING', 'PENDING', undefined].includes(message.status) || !message.status_message
    ? 'Genie is thinking…'
    : message.status_message.replace(/\.\.\.$/, '…');

export default function ChatBubble({ message, onFeedback, onRetry }) {
  const isUser = message.role === 'user';
  const { name, email } = useCurrentUser();
  const [feedbackSent, setFeedbackSent] = useState(null);

  const handleFeedback = (rating) => {
    if (onFeedback && !feedbackSent) {
      onFeedback(message.message_id, rating);
      setFeedbackSent(rating);
    }
  };

  if (isUser) {
    return (
      <div className={`${styles.messageRow} ${styles.userRow}`}>
        <div className={`${styles.bubble} ${styles.userBubble}`}>{message.content}</div>
        <span className={styles.userAvatar} aria-hidden="true">{getInitials(name, email)}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.messageRow} ${styles.genieRow}`}>
      <div className={styles.avatar}>
        <GenieLogo size={28} />
      </div>

      <div className={`${styles.bubble} ${styles.genieBubble}`}>
        {message.trusted_asset && (
          <div className={styles.trustedBadge}>
            <span aria-hidden="true">✓</span> Verified
          </div>
        )}

        {/* Each state mounts its own element, so the answer fades in when polling completes */}
        {message.status === 'COMPLETED' ? (
          <div className={styles.answer}>
            <Markdown text={message.summary} />
            {message.data && <ResultView data={message.data} />}

            <div className={`${styles.feedbackActions} ${feedbackSent ? styles.feedbackDone : ''}`}>
              <button
                className={`${styles.iconBtn} ${feedbackSent === 'POSITIVE' ? styles.selectedBtn : ''}`}
                onClick={() => handleFeedback('POSITIVE')}
                disabled={feedbackSent !== null}
                title="Helpful"
                aria-label="Helpful"
              >
                <ThumbsUpIcon size={16} />
              </button>
              <button
                className={`${styles.iconBtn} ${feedbackSent === 'NEGATIVE' ? styles.selectedBtn : ''}`}
                onClick={() => handleFeedback('NEGATIVE')}
                disabled={feedbackSent !== null}
                title="Not Helpful"
                aria-label="Not helpful"
              >
                <ThumbsDownIcon size={16} />
              </button>
              {feedbackSent && <span className={styles.feedbackThanks}>Thanks for the feedback</span>}
            </div>
          </div>
        ) : FAILED_STATUSES.includes(message.status) ? (
          <div className={styles.errorCard} role="alert">
            <AlertIcon size={18} className={styles.errorIcon} />
            <div className={styles.errorBody}>
              <div className={styles.errorTitle}>Genie failed to process this request.</div>
              {(message.error || message.status_message) && (
                <div className={styles.errorDetail}>{message.error || message.status_message}</div>
              )}
            </div>
            {onRetry && (
              <button type="button" className={styles.retryBtn} onClick={onRetry}>
                <RetryIcon size={14} /> Try again
              </button>
            )}
          </div>
        ) : (
          <div className={styles.thinking} role="status" aria-live="polite">
            <div className={styles.typing} aria-hidden="true">
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            {/* key restarts the fade each time the step changes */}
            <span key={progressText(message)} className={styles.thinkingText}>{progressText(message)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
