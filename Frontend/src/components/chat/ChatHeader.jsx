import ThemeToggle from '@/components/ui/ThemeToggle';
import { NewChatIcon, SidebarIcon } from '@/components/ui/icons';
import styles from './ChatHeader.module.css';

// Top bar of the chat area: sidebar shortcuts (while it is closed), chat title, theme toggle.
export default function ChatHeader({ title, bordered, sidebarOpen, onOpenSidebar, onNewChat }) {
  const shortcutTab = sidebarOpen ? -1 : 0;

  return (
    <header className={`${styles.header} ${bordered ? styles.bordered : ''}`}>
      <div className={styles.left}>
        <div className={`${styles.shortcuts} ${sidebarOpen ? '' : styles.shortcutsShown}`}>
          <button
            className={styles.iconBtn}
            onClick={onOpenSidebar}
            title="Open sidebar"
            aria-label="Open sidebar"
            tabIndex={shortcutTab}
          >
            <SidebarIcon />
          </button>
          <button
            className={styles.iconBtn}
            onClick={onNewChat}
            title="New chat"
            aria-label="New chat"
            tabIndex={shortcutTab}
          >
            <NewChatIcon />
          </button>
        </div>
        {title && <h2 className={styles.title} title={title}>{title}</h2>}
      </div>
      <div className={styles.right}>
        <ThemeToggle />
      </div>
    </header>
  );
}
