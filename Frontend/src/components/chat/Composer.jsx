import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_HEIGHT = 200;
const SINGLE_LINE = 38; // matches the field's min-h-[38px] and the send button

// Message box: Enter sends, Shift+Enter adds a line, and the field grows with its text.
// Typing stays possible while Genie is busy; only sending is blocked.
export default function Composer({ value, onChange, onSubmit, busy, inputRef, autoFocus }) {
  const canSend = value.trim().length > 0 && !busy;
  const fieldRef = useRef(null);

  // The parent gets the textarea through inputRef (to focus it)
  useImperativeHandle(inputRef, () => fieldRef.current, []);

  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    // An empty field stays one line: Chrome counts a wrapped placeholder in scrollHeight
    el.style.height = 'auto';
    const height = value ? Math.min(Math.ceil(el.scrollHeight), MAX_HEIGHT) : SINGLE_LINE;
    el.style.height = `${Math.max(height, SINGLE_LINE)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    // Keep the send button centred on one line, and pinned to the bottom once the text wraps
    el.form?.toggleAttribute('data-multiline', height > SINGLE_LINE + 4);
  }, [value]);

  const handleKeyDown = (e) => {
    // isComposing: don't send mid-word while an IME (e.g. Japanese input) is open
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) onSubmit(e);
    }
  };

  return (
    <form
      className={cn(
        'flex w-full items-center gap-2 rounded-3xl border border-line py-[0.55rem] pr-[0.55rem] pl-[1.1rem] shadow-md transition duration-250',
        'hover:border-secondary',
        // data-multiline is set by the layout effect above
        'data-multiline:items-end max-md:rounded-[22px]',
        busy ? 'bg-soft' : 'bg-main'
      )}
      onSubmit={(e) => {
        e.preventDefault();
        if (canSend) onSubmit(e);
      }}
    >
      <textarea
        ref={fieldRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={busy ? 'Genie is working on your answer…' : 'Ask Genie anything about your data…'}
        // 16px on phones keeps iOS Safari from zooming into the field
        className="block max-h-[200px] min-h-[38px] min-w-0 flex-1 resize-none overflow-y-hidden border-none bg-transparent py-[7px] text-base leading-6 text-primary outline-none scrollbar-thin placeholder:text-secondary max-md:text-[16px]"
        aria-label="Message Genie"
        autoFocus={autoFocus}
      />
      <button
        type="submit"
        className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand text-main dark:text-primary shadow-md transition duration-200 ease-smooth enabled:hover:-translate-y-px enabled:hover:shadow-lg enabled:active:scale-90 disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-secondary disabled:shadow-none"
        disabled={!canSend}
        aria-label={busy ? 'Genie is answering' : 'Send'}
        title={busy ? 'Genie is answering' : 'Send'}
      >
        {busy ? <span className="size-4 animate-spinner rounded-full border-2 border-accent-soft border-t-accent" aria-hidden="true" /> : <ArrowUp size={18} />}
      </button>
    </form>
  );
}
