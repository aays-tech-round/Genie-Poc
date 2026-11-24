import { useRef, useState } from 'react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import useChats from '@/hooks/useChats';
import { isMobileViewport } from '@/lib/utils';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import MessageList from '@/components/chat/MessageList';
import ChatFooter from '@/components/chat/ChatFooter';
import Composer from '@/components/chat/Composer';
import Spinner from '@/components/ui/Spinner';

export default function Home() {
  const { name, email } = useCurrentUser();
  const {
    chats, chatsLoading, activeChat, activeChatId, messages, isProcessing, isUnloaded, loadError, processingChatIds,
    selectChat, reloadActiveChat, startNewChat, sendQuestion, togglePin, renameChat, deleteChat,
  } = useChats(email);
  const [inputValue, setInputValue] = useState('');
  // Starts closed on mobile, where it would cover the chat
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport());
  const inputRef = useRef(null);

  const firstName = (name || '').split(' ')[0];
  // No open chat, or an open chat that really has no messages: show the welcome screen
  const isEmpty = !isUnloaded && messages.length === 0;

  const closeSidebarOnMobile = () => {
    if (isMobileViewport()) setSidebarOpen(false);
  };

  const handleSend = () => {
    const content = inputValue;
    setInputValue('');
    sendQuestion(content);
  };

  const handleNewChat = () => {
    startNewChat();
    setInputValue('');
    closeSidebarOnMobile();
    inputRef.current?.focus();
  };

  const handleSelectChat = (chatId) => {
    selectChat(chatId);
    closeSidebarOnMobile();
  };

  const composer = (
    <Composer
      value={inputValue}
      onChange={setInputValue}
      onSubmit={handleSend}
      busy={isProcessing || isUnloaded}
      placeholder={isUnloaded ? (loadError ? 'This chat could not be loaded' : 'Loading chat…') : undefined}
      inputRef={inputRef}
    />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-soft">
      <Sidebar
        open={sidebarOpen}
        chats={chats}
        loading={chatsLoading}
        activeChatId={activeChatId}
        processingChatIds={processingChatIds}
        onSelect={handleSelectChat}
        onNewChat={handleNewChat}
        onTogglePin={togglePin}
        onRename={renameChat}
        onDelete={deleteChat}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="relative flex h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-main">
        {/* Soft purple glow behind the welcome screen */}
        {isEmpty && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-[fadeOnly_1s_ease_both] bg-[radial-gradient(520px_circle_at_30%_18%,var(--accent-soft),transparent_70%),radial-gradient(480px_circle_at_72%_30%,var(--accent-soft),transparent_70%)] opacity-90"
          />
        )}

        <ChatHeader
          title={isEmpty ? null : activeChat?.title}
          bordered={!isEmpty}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
          onNewChat={handleNewChat}
        />

        {isEmpty ? (
          <WelcomeScreen
            firstName={firstName}
            composer={composer}
            onPickSuggestion={sendQuestion}
            busy={isProcessing}
          />
        ) : (
          <>
            {isUnloaded ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-sm text-secondary">
                {loadError ? (
                  <>
                    <span>{loadError}</span>
                    <button
                      type="button"
                      className="rounded-full border border-line bg-main px-3 py-[0.35rem] text-[0.8rem] font-medium text-primary transition hover:border-secondary hover:bg-line active:scale-96"
                      onClick={reloadActiveChat}
                    >
                      Try again
                    </button>
                  </>
                ) : (
                  <>
                    <Spinner className="size-5" aria-hidden="true" />
                    <span role="status">Loading chat…</span>
                  </>
                )}
              </div>
            ) : (
              <MessageList
                chatId={activeChatId}
                messages={messages}
                isProcessing={isProcessing}
                onRetry={sendQuestion}
                onAsk={sendQuestion}
              />
            )}
            <ChatFooter composer={composer} />
          </>
        )}
      </main>
    </div>
  );
}
