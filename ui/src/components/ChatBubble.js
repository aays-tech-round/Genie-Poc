"use client";

import React, { useState } from 'react';
import styles from './ChatBubble.module.css';

export default function ChatBubble({ message, onFeedback }) {
  const isUser = message.role === 'user';
  const [feedbackSent, setFeedbackSent] = useState(null);

  const handleFeedback = (rating) => {
    if (onFeedback && !feedbackSent) {
      onFeedback(message.message_id, rating);
      setFeedbackSent(rating);
    }
  };

  const renderTable = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;
    
    // Attempt to extract headers from the first row of data
    const headers = Object.keys(data[0]);

    return (
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {headers.map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {headers.map(h => <td key={h}>{String(row[h])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={`${styles.messageRow} ${isUser ? styles.userRow : styles.genieRow}`}>
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.genieBubble}`}>
        
        {!isUser && message.trusted_asset && (
          <div className={styles.trustedBadge}>
            <span style={{ fontSize: '12px' }}>✓</span> Verified
          </div>
        )}

        {isUser ? (
          <div>{message.content}</div>
        ) : (
          <div>
            {message.status === 'COMPLETED' ? (
              <>
                <div>{message.summary}</div>
                {message.data && renderTable(message.data)}
                
                <div className={styles.feedbackActions}>
                   <button 
                     className={`${styles.iconBtn} ${feedbackSent === 'POSITIVE' ? styles.successBtn : ''}`}
                     onClick={() => handleFeedback('POSITIVE')}
                     disabled={feedbackSent !== null}
                     title="Helpful"
                   >
                     👍
                   </button>
                   <button 
                     className={styles.iconBtn}
                     onClick={() => handleFeedback('NEGATIVE')}
                     disabled={feedbackSent !== null}
                     title="Not Helpful"
                   >
                     👎
                   </button>
                </div>
              </>
            ) : message.status === 'FAILED' ? (
               <div style={{ color: '#ef4444' }}>❌ Genie failed to process this request.</div>
            ) : (
              <div className={styles.statusIndicator}>
                {message.status_message || "Analyzing request"}
                <div className={styles.dots}>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                  <span className={styles.dot}></span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
