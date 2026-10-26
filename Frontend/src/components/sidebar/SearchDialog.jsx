import { useEffect, useMemo, useState } from 'react';
import { ChatIcon, CloseIcon, NewChatIcon, PinIcon, SearchIcon } from '@/components/ui/icons';
import styles from './SearchDialog.module.css';

// Modal search over chat titles and the text of every question / answer.
export default function SearchDialog({ chats, onSelect, onNewChat, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => (m.content || m.summary || '').toLowerCase().includes(q))
    );
  }, [chats, query]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <SearchIcon size={18} />
          <input
            className={styles.input}
            placeholder="Search chats..."
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close search">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.results}>
          {!query && (
            <button className={styles.result} onClick={() => { onNewChat(); onClose(); }}>
              <NewChatIcon size={18} /> New chat
            </button>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              className={styles.result}
              onClick={() => { onSelect(c.id); onClose(); }}
            >
              {c.pinned ? <PinIcon size={18} /> : <ChatIcon size={18} />}
              <span className={styles.resultTitle}>{c.title}</span>
            </button>
          ))}
          {query && results.length === 0 && (
            <div className={styles.empty}>No chats found</div>
          )}
        </div>
      </div>
    </div>
  );
}
