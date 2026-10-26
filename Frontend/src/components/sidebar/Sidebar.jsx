import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatIcon, GenieLogo, NewChatIcon, SearchIcon, SidebarIcon } from '@/components/ui/icons';
import ChatListItem from './ChatListItem';
import SearchDialog from './SearchDialog';
import UserMenu from './UserMenu';
import styles from './Sidebar.module.css';

// Buckets chats (already sorted newest first) into Today / Yesterday / Previous 7 days / Older.
const groupByDate = (chats) => {
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  const groups = [
    { label: 'Today', from: startOfToday, items: [] },
    { label: 'Yesterday', from: startOfToday - day, items: [] },
    { label: 'Previous 7 days', from: startOfToday - 7 * day, items: [] },
    { label: 'Older', from: -Infinity, items: [] },
  ];
  chats.forEach((c) => groups.find((g) => (c.updatedAt || 0) >= g.from).items.push(c));
  return groups.filter((g) => g.items.length > 0);
};

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

// Left rail: branding, new chat, search, chat history (pinned + by date) and the account menu.
export default function Sidebar({
  open, chats, activeChatId, processingChatIds, onSelect, onNewChat, onTogglePin, onRename, onDelete, onToggle,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcut, setShortcut] = useState('Ctrl K');
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl+K / ⌘K opens chat search from anywhere
  useEffect(() => {
    if (isMac()) setShortcut('⌘K');
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const sorted = useMemo(
    () => [...chats].sort((a, b) => b.updatedAt - a.updatedAt),
    [chats]
  );
  const pinned = sorted.filter((c) => c.pinned);
  const recentGroups = groupByDate(sorted.filter((c) => !c.pinned));

  const itemProps = { onSelect, onTogglePin, onRename, onDelete };
  const renderItem = (c) => (
    <ChatListItem
      key={c.id}
      chat={c}
      active={c.id === activeChatId}
      busy={processingChatIds?.has(c.id)}
      {...itemProps}
    />
  );

  return (
    <>
      <aside className={`${styles.sidebar} ${open ? '' : styles.sidebarClosed}`} aria-hidden={!open} inert={!open}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <GenieLogo size={26} />
            <span className={styles.brandText}>Genie</span>
          </div>
          <button className={styles.iconBtn} onClick={onToggle} title="Close sidebar" aria-label="Close sidebar">
            <SidebarIcon />
          </button>
        </div>

        <div className={styles.actions}>
          <button className={styles.newChatBtn} onClick={onNewChat}>
            <span className={styles.newChatIcon}><NewChatIcon size={16} /></span>
            New chat
          </button>
          <button className={styles.searchBtn} onClick={() => setSearchOpen(true)}>
            <SearchIcon size={16} />
            <span className={styles.searchBtnText}>Search chats</span>
            <kbd className={styles.kbd}>{shortcut}</kbd>
          </button>
        </div>

        <nav className={styles.lists} aria-label="Chat history">
          {pinned.length > 0 && (
            <section>
              <div className={styles.sectionLabel}>Pinned</div>
              {pinned.map(renderItem)}
            </section>
          )}

          {recentGroups.map((g) => (
            <section key={g.label}>
              <div className={styles.sectionLabel}>{g.label}</div>
              {g.items.map(renderItem)}
            </section>
          ))}

          {chats.length === 0 && (
            <div className={styles.emptyHistory}>
              <ChatIcon size={20} />
              <span>Your chats will show up here</span>
            </div>
          )}
        </nav>

        <div className={styles.footer}>
          <UserMenu />
        </div>
      </aside>

      {/* Dims the page behind the sidebar on small screens */}
      {open && <div className={styles.mobileScrim} onClick={onToggle} />}

      {searchOpen && (
        <SearchDialog
          chats={sorted}
          onSelect={onSelect}
          onNewChat={onNewChat}
          onClose={closeSearch}
        />
      )}
    </>
  );
}
