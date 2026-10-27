import { useCallback, useRef, useState } from 'react';
import useDismiss from '@/hooks/useDismiss';
import { Ellipsis, Pencil, Pin, Trash } from 'lucide-react';
import { Menu, MenuItem } from '@/components/ui/Menu';
import { cn } from '@/lib/utils';

const row = 'group relative mb-px flex items-center rounded-[10px] transition-colors';
// Accent marker on the open chat
const activeMarker =
  'before:absolute before:inset-y-1/4 before:left-0 before:w-[3px] before:animate-[fadeOnly_0.2s_ease_both] before:rounded-r-[3px] before:bg-accent';

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
      <div className={cn(row, 'bg-accent-soft', activeMarker)}>
        <input
          className="m-[3px] flex-1 rounded-lg border border-accent bg-main px-2 py-[0.4rem] text-[0.9rem] text-primary ring-3 ring-accent-soft outline-none"
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
      className={cn(row, active ? cn('bg-accent-soft', activeMarker) : menuOpen ? 'bg-line' : 'hover:bg-line')}
    >
      <button
        className={cn(
          'min-w-0 flex-1 truncate px-[0.6rem] py-[0.45rem] text-left text-sm',
          active ? 'font-medium text-primary' : 'text-secondary group-hover:text-primary'
        )}
        onClick={() => onSelect(chat.id)}
        title={chat.title}
        aria-current={active ? 'page' : undefined}
      >
        {chat.title}
      </button>
      {/* Gives way to the "..." button on hover */}
      {busy && !menuOpen && (
        <span
          className="mr-2 size-[7px] shrink-0 animate-[busyPulse_1.6s_ease-out_infinite] rounded-full bg-accent group-hover:hidden"
          title="Genie is answering"
          aria-label="Genie is answering"
        />
      )}
      <button
        // Hidden until hover, except on touch screens, which have no hover
        className={cn(
          'mr-1 flex size-[30px] items-center justify-center rounded-md text-secondary transition hover:text-primary [@media(hover:none)]:opacity-100',
          active || menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Chat options"
      >
        <Ellipsis size={18} />
      </button>

      {menuOpen && (
        <Menu className="top-[calc(100%+4px)] right-0 w-[170px] origin-top-right">
          <MenuItem onClick={() => { setMenuOpen(false); onTogglePin(chat.id); }}>
            <Pin size={16} /> {chat.pinned ? 'Unpin' : 'Pin chat'}
          </MenuItem>
          <MenuItem onClick={() => { setMenuOpen(false); setDraft(chat.title); setRenaming(true); }}>
            <Pencil size={16} /> Rename
          </MenuItem>
          <MenuItem tone="danger" onClick={() => { setMenuOpen(false); onDelete(chat.id); }}>
            <Trash size={16} /> Delete
          </MenuItem>
        </Menu>
      )}
    </div>
  );
}
