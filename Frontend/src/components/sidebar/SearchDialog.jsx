import { useMemo, useState } from 'react';
import { MessageCircle, PenLine, Pin, Search, X } from 'lucide-react';
import { iconButton } from '@/components/ui/classes';
import Modal from '@/components/ui/Modal';

const resultRow =
  'flex w-full items-center gap-3 rounded-[10px] px-3 py-[0.65rem] text-left text-[0.9rem] text-primary transition-colors duration-[120ms] hover:bg-line';

// Modal search over chat titles and the text of every question / answer.
export default function SearchDialog({ chats, onSelect, onNewChat, onClose }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => (m.content || m.summary || '').toLowerCase().includes(q))
    );
  }, [chats, query]);

  return (
    <Modal
      onClose={onClose}
      closeOnEscape
      overlayClassName="items-start px-4 pt-[12vh] pb-4 backdrop-blur-[3px]"
      className="flex max-h-[70vh] w-[640px] flex-col overflow-hidden"
    >
      <div className="flex items-center gap-[0.6rem] border-b border-line py-2 pr-2 pl-4 text-secondary">
        <Search size={18} />
        <input
          className="flex-1 border-none bg-transparent py-[0.6rem] text-[1rem] text-primary outline-none"
          placeholder="Search chats..."
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={iconButton} onClick={onClose} aria-label="Close search">
          <X size={18} />
        </button>
      </div>
      <div className="overflow-y-auto p-2">
        {!query && (
          <button className={resultRow} onClick={() => { onNewChat(); onClose(); }}>
            <PenLine size={18} /> New chat
          </button>
        )}
        {results.map((c) => (
          <button
            key={c.id}
            className={resultRow}
            onClick={() => { onSelect(c.id); onClose(); }}
          >
            {c.pinned ? <Pin size={18} /> : <MessageCircle size={18} />}
            <span className="truncate">{c.title}</span>
          </button>
        ))}
        {query && results.length === 0 && (
          <div className="p-6 text-center text-[0.9rem] text-secondary">No chats found</div>
        )}
      </div>
    </Modal>
  );
}
