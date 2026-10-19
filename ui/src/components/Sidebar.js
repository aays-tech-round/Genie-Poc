"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatIcon, CloseIcon, EditIcon, GenieLogo, MoreIcon, NewChatIcon,
  PinIcon, SearchIcon, SidebarIcon, TrashIcon,
} from './icons';
import styles from './Sidebar.module.css';

const useOutsideClose = (ref, active, onClose) => {
  useEffect(() => {
    if (!active) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active, onClose]);
};

function ChatItem({ chat, active, onSelect, onTogglePin, onRename, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(chat.title);
  const itemRef = useRef(null);

  useOutsideClose(itemRef, menuOpen, () => setMenuOpen(false));

  const commitRename = () => {
    const title = draft.trim();
    if (title && title !== chat.title) onRename(chat.id, title);
    setRenaming(false);
  };

  if (renaming) {
    return (
      <div className={`${styles.chatItem} ${styles.chatItemActive}`}>
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
      className={`${styles.chatItem} ${active ? styles.chatItemActive : ''} ${menuOpen ? styles.chatItemMenuOpen : ''}`}
    >
      <button className={styles.chatTitle} onClick={() => onSelect(chat.id)} title={chat.title}>
        {chat.title}
      </button>
      <button
        className={styles.moreBtn}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Chat options"
      >
        <MoreIcon size={18} />
      </button>

      {menuOpen && (
        <div className={styles.itemMenu} role="menu">
          <button
            className={styles.itemMenuBtn}
            onClick={() => { setMenuOpen(false); onTogglePin(chat.id); }}
          >
            <PinIcon size={16} /> {chat.pinned ? 'Unpin' : 'Pin chat'}
          </button>
          <button
            className={styles.itemMenuBtn}
            onClick={() => { setMenuOpen(false); setDraft(chat.title); setRenaming(true); }}
          >
            <EditIcon size={16} /> Rename
          </button>
          <button
            className={`${styles.itemMenuBtn} ${styles.danger}`}
            onClick={() => { setMenuOpen(false); onDelete(chat.id); }}
          >
            <TrashIcon size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function SearchModal({ chats, onSelect, onNewChat, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Matches chat titles and the text of every question / answer in the chat.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => (m.content || m.summary || '').toLowerCase().includes(q))
    );
  }, [chats, query]);

  return (
    <div className={styles.searchBackdrop} onClick={onClose}>
      <div className={styles.searchModal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.searchHeader}>
          <SearchIcon size={18} />
          <input
            className={styles.searchInput}
            placeholder="Search chats..."
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.iconBtn} onClick={onClose} aria-label="Close search">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className={styles.searchResults}>
          {!query && (
            <button className={styles.searchResult} onClick={() => { onNewChat(); onClose(); }}>
              <NewChatIcon size={18} /> New chat
            </button>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              className={styles.searchResult}
              onClick={() => { onSelect(c.id); onClose(); }}
            >
              {c.pinned ? <PinIcon size={18} /> : <ChatIcon size={18} />}
              <span className={styles.searchResultTitle}>{c.title}</span>
            </button>
          ))}
          {query && results.length === 0 && (
            <div className={styles.searchEmpty}>No chats found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  open, chats, activeChatId, onSelect, onNewChat, onTogglePin, onRename, onDelete, onToggle,
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  const sorted = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats]
  );
  const pinned = sorted.filter((c) => c.pinned);
  const recents = sorted.filter((c) => !c.pinned);

  const itemProps = { onSelect, onTogglePin, onRename, onDelete };

  return (
    <>
      <aside className={`${styles.sidebar} ${open ? '' : styles.sidebarClosed}`}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <GenieLogo size={28} />
            <span className={styles.brandText}>Genie</span>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={() => setSearchOpen(true)} title="Search chats">
              <SearchIcon />
            </button>
            <button className={styles.iconBtn} onClick={onToggle} title="Close sidebar">
              <SidebarIcon />
            </button>
          </div>
        </div>

        <button className={styles.newChatBtn} onClick={onNewChat}>
          <NewChatIcon size={18} /> New chat
        </button>

        <nav className={styles.lists}>
          {pinned.length > 0 && (
            <section>
              <div className={styles.sectionLabel}>Pinned</div>
              {pinned.map((c) => (
                <ChatItem key={c.id} chat={c} active={c.id === activeChatId} {...itemProps} />
              ))}
            </section>
          )}

          <section>
            <div className={styles.sectionLabel}>Recents</div>
            {recents.length === 0 && (
              <div className={styles.emptyText}>Your chats will show up here</div>
            )}
            {recents.map((c) => (
              <ChatItem key={c.id} chat={c} active={c.id === activeChatId} {...itemProps} />
            ))}
          </section>
        </nav>
      </aside>

      {/* Dims the page behind the sidebar on small screens */}
      {open && <div className={styles.mobileScrim} onClick={onToggle} />}

      {searchOpen && (
        <SearchModal
          chats={sorted}
          onSelect={onSelect}
          onNewChat={onNewChat}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  );
}
