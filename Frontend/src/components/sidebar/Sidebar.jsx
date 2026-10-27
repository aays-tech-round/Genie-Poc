import { useCallback, useMemo, useState } from 'react';
import { MessageCircle, PanelLeft, PenLine, Search } from 'lucide-react';
import ChatListItem from './ChatListItem';
import SearchDialog from './SearchDialog';
import UserMenu from './UserMenu';
import { iconButton } from '@/components/ui/classes';
import useKeydown from '@/hooks/useKeydown';
import { cn } from '@/lib/utils';

const sectionLabel = 'px-[0.6rem] pt-2 pb-[0.3rem] text-xs font-semibold tracking-[0.02em] text-secondary';

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

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform);

// Left rail: branding, new chat, search, chat history (pinned + by date) and the account menu.
export default function Sidebar({
  open, chats, activeChatId, processingChatIds, onSelect, onNewChat, onTogglePin, onRename, onDelete, onToggle,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const shortcut = isMac() ? '⌘K' : 'Ctrl K';
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Ctrl+K / ⌘K opens chat search from anywhere
  useKeydown((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  });

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
      {/* On phones the sidebar slides over the chat instead of pushing it */}
      <aside
        className={cn(
          'z-30 flex h-dvh w-[268px] shrink-0 flex-col border-r border-line bg-soft transition-[margin-left,opacity] duration-[0.32s,0.25s] ease-swing',
          'max-md:fixed max-md:top-0 max-md:left-0 max-md:w-[min(280px,85vw)] max-md:shadow-xl',
          !open && '-ml-[268px] opacity-0 max-md:ml-[max(-280px,-85vw)] max-md:shadow-none'
        )}
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex min-h-[60px] items-center justify-between pr-[0.6rem] pl-4">
          {/* Served from public/ */}
          <img className="h-7 w-auto" src="/MarsLogo1.png" alt="Mars" />
          <button className={iconButton} onClick={onToggle} title="Close sidebar" aria-label="Close sidebar">
            <PanelLeft size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-0.5 px-[0.6rem] pt-1 pb-2">
          <button
            className="mb-1 flex items-center gap-[0.6rem] rounded-xl border border-line bg-main py-2 pr-[0.6rem] pl-2 text-left text-[0.9rem] font-medium text-primary shadow-sm transition duration-200 hover:border-accent hover:shadow-md active:scale-98"
            onClick={onNewChat}
          >
            <span className="inline-flex size-[26px] items-center justify-center rounded-lg bg-brand text-main dark:text-primary shadow-md">
              <PenLine size={16} />
            </span>
            New chat
          </button>
          <button
            className="flex items-center gap-[0.6rem] rounded-[10px] py-2 pr-[0.6rem] pl-3 text-left text-sm text-secondary transition hover:bg-line hover:text-primary"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span className="flex-1">Search chats</span>
            <kbd className="rounded-[5px] border border-line bg-main px-[0.4rem] py-[0.1rem] font-sans text-[0.68rem] text-secondary">
              {shortcut}
            </kbd>
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-[0.6rem] overflow-y-auto scrollbar-thin px-[0.6rem] pb-4"
          aria-label="Chat history"
        >
          {pinned.length > 0 && (
            <section>
              <div className={sectionLabel}>Pinned</div>
              {pinned.map(renderItem)}
            </section>
          )}

          {recentGroups.map((g) => (
            <section key={g.label}>
              <div className={sectionLabel}>{g.label}</div>
              {g.items.map(renderItem)}
            </section>
          ))}

          {chats.length === 0 && (
            <div className="mx-2 mt-6 flex flex-col items-center gap-2 text-center text-[0.82rem] text-secondary">
              <MessageCircle size={20} />
              <span>Your chats will show up here</span>
            </div>
          )}
        </nav>

        <div className="border-t border-line px-[0.6rem] py-2">
          <UserMenu />
        </div>
      </aside>

      {/* Dims the page behind the sidebar on small screens */}
      {open && (
        <div
          className="hidden max-md:fixed max-md:inset-0 max-md:z-25 max-md:block max-md:animate-[fadeOnly_0.25s_ease] max-md:bg-overlay"
          onClick={onToggle}
        />
      )}

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
