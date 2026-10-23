"use client";

import React, { useLayoutEffect } from 'react';
import { ArrowUpIcon } from '@/components/ui/icons';
import styles from './Composer.module.css';

const MAX_HEIGHT = 200;
const SINGLE_LINE = 38; // matches .field min-height and the send button

// Message box: Enter sends, Shift+Enter adds a line, and the field grows with its text.
// Typing stays possible while Genie is busy; only sending is blocked.
export default function Composer({ value, onChange, onSubmit, busy, inputRef, autoFocus }) {
  const canSend = value.trim().length > 0 && !busy;

  useLayoutEffect(() => {
    const el = inputRef?.current;
    if (!el) return;
    // An empty field stays one line: Chrome counts a wrapped placeholder in scrollHeight
    el.style.height = 'auto';
    const height = value ? Math.min(Math.ceil(el.scrollHeight), MAX_HEIGHT) : SINGLE_LINE;
    el.style.height = `${Math.max(height, SINGLE_LINE)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    // Keep the send button centred on one line, and pinned to the bottom once the text wraps
    el.form?.toggleAttribute('data-multiline', height > SINGLE_LINE + 4);
  }, [value, inputRef]);

  const handleKeyDown = (e) => {
    // isComposing: don't send mid-word while an IME (e.g. Japanese input) is open
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSubmit(e);
    }
  };

  return (
    <form
      className={`${styles.composer} ${busy ? styles.busy : ''}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit(e);
      }}
    >
      <textarea
        ref={inputRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={busy ? 'Genie is working on your answer…' : 'Ask Genie anything about your data…'}
        className={styles.field}
        aria-label="Message Genie"
        autoFocus={autoFocus}
      />
      <button
        type="submit"
        className={styles.send}
        disabled={!canSend}
        aria-label={busy ? 'Genie is answering' : 'Send'}
        title={busy ? 'Genie is answering' : 'Send'}
      >
        {busy ? <span className={styles.spinner} aria-hidden="true" /> : <ArrowUpIcon size={18} />}
      </button>
    </form>
  );
}
