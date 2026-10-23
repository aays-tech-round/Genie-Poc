import React from 'react';
import styles from './ChatFooter.module.css';

// Composer dock under an active conversation, with the accuracy disclaimer.
export default function ChatFooter({ composer }) {
  return (
    <div className={styles.footer}>
      <div className={styles.inner}>{composer}</div>
      <div className={styles.disclaimer}>
        Databricks Genie can make mistakes. Check important info.
      </div>
    </div>
  );
}
