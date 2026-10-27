import ThemeToggle from '@/components/ui/ThemeToggle';
import { iconButton } from '@/components/ui/classes';
import { PanelLeft, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';

// Top bar of the chat area: sidebar shortcuts (while it is closed), chat title, theme toggle.
export default function ChatHeader({ title, bordered, sidebarOpen, onOpenSidebar, onNewChat }) {
  const shortcutTab = sidebarOpen ? -1 : 0;

  return (
    <header
      className={cn(
        'relative z-5 flex min-h-[60px] shrink-0 items-center justify-between gap-3 border-b border-transparent px-4 transition-colors duration-200 max-md:min-h-[54px] max-md:px-3 max-md:py-2',
        bordered && 'border-faint bg-main'
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        {/* Sidebar shortcuts, slid in only while the sidebar is closed */}
        <div
          className={cn(
            'flex items-center gap-0.5 overflow-hidden transition-[max-width,opacity] duration-[0.3s,0.2s] ease-swing',
            sidebarOpen ? 'max-w-0 opacity-0' : 'max-w-[90px] opacity-100'
          )}
        >
          <button
            className={iconButton}
            onClick={onOpenSidebar}
            title="Open sidebar"
            aria-label="Open sidebar"
            tabIndex={shortcutTab}
          >
            <PanelLeft size={20} />
          </button>
          <button
            className={iconButton}
            onClick={onNewChat}
            title="New chat"
            aria-label="New chat"
            tabIndex={shortcutTab}
          >
            <PenLine size={20} />
          </button>
        </div>
        {title && (
          <h2 className="animate-fade truncate px-2 text-[0.95rem] font-semibold text-primary" title={title}>
            {title}
          </h2>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
