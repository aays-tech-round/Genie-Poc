import { useCallback, useRef, useState } from 'react';
import useDismiss from '@/hooks/useDismiss';
import { Ellipsis, Pencil, Pin, Trash } from 'lucide-react';
import styles from './ChatListItem.module.css';

// One chat in the sidebar history, with its pin / rename / delete menu.
export default function ChatListItem({ chat, active, busy, onSelect, onTogglePin, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const itemRef = useRef(null);

  useDismiss(itemRef, menuOpen, useCallback(() => setMenuOpen(false), []));

  const commitRename = () => {
    const title = draft.trim();
    if (title && title !== chat.title) onRename(chat.id, title);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className={`${styles.item} ${styles.active}`}>
        <input
          className={styles.renameInput}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') setRenaming(false);
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={itemRef}
      className={`${styles.item} ${active ? styles.active : ''} ${menuOpen ? styles.menuOpen : ''}`}
    >
      <button
        className={styles.title}
        onClick={() => onSelect(chat.id)}
        title={chat.title}
        aria-current={active ? 'page' : undefined}
      >
        {chat.title}
      </button>
      {busy && <span className={styles.busyDot} title="Genie is answering" aria-label="Genie is answering" />}
      <button
        className={styles.moreBtn}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Chat options"
      >
        <Ellipsis size={18} />
      </button>

      {menuOpen && (
        <div className={styles.menu} role="menu">
          <button
            className={styles.menuBtn}
            onClick={() => { setMenuOpen(false); onTogglePin(chat.id); }}
          >
            <Pin size={16} /> {chat.pinned ? 'Unpin' : 'Pin chat'}
          </button>
          <button
            className={styles.menuBtn}
            onClick={() => { setMenuOpen(false); setDraft(chat.title); setRenaming(true); }}
          >
            <Pencil size={16} /> Rename
          </button>
          <button
            className={`${styles.menuBtn} ${styles.danger}`}
            onClick={() => { setMenuOpen(false); onDelete(chat.id); }}
          >
            <Trash size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
