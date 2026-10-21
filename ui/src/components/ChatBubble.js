"use client";

import React, { useState } from 'react';
import styles from './ChatBubble.module.css';
import { AlertIcon, GenieLogo, ThumbsDownIcon, ThumbsUpIcon } from './icons';
import Markdown from './Markdown';
import ResultView from './ResultView';

export default function ChatBubble({ message, onFeedback }) {
  const isUser = message.role === 'user';
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
            <span style={{ fontSize: '12px' }}>✓</span> Verified
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
        ) : message.status === 'FAILED' || message.status === 'CANCELLED' ? (
          <div className={styles.errorCard} role="alert">
            <AlertIcon size={18} className={styles.errorIcon} />
            <div>
              <div className={styles.errorTitle}>Genie failed to process this request.</div>
              {(message.error || message.status_message) && (
                <div className={styles.errorDetail}>{message.error || message.status_message}</div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.thinking} role="status" aria-live="polite">
            <div className={styles.typing} aria-hidden="true">
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <span className={styles.thinkingText}>Genie is thinking…</span>
          </div>
        )}
      </div>
    </div>
  );
}
