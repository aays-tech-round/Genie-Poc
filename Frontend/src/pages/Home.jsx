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

export default function Home() {
  const { name, email } = useCurrentUser();
  const {
    chats, activeChat, activeChatId, messages, isProcessing, processingChatIds,
    selectChat, startNewChat, sendQuestion, togglePin, renameChat, deleteChat,
  } = useChats(email);
  const [inputValue, setInputValue] = useState('');
  // Starts closed on mobile, where it would cover the chat
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileViewport());
  const inputRef = useRef(null);

  const firstName = (name || '').split(' ')[0];
  const isEmpty = messages.length === 0;

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
      busy={isProcessing}
      inputRef={inputRef}
    />
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-soft">
      <Sidebar
        open={sidebarOpen}
        chats={chats}
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
            <MessageList
              chatId={activeChatId}
              messages={messages}
              isProcessing={isProcessing}
              onRetry={sendQuestion}
              onAsk={sendQuestion}
            />
            <ChatFooter composer={composer} />
          </>
        )}
      </main>
    </div>
  );
}
