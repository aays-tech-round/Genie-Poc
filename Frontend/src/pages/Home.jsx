import { useEffect, useRef, useState } from 'react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import useChats from '@/hooks/useChats';
import { isMobileViewport } from '@/lib/utils';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatHeader from '@/components/chat/ChatHeader';
import WelcomeScreen from '@/components/chat/WelcomeScreen';
import MessageList from '@/components/chat/MessageList';
import ChatFooter from '@/components/chat/ChatFooter';
import Composer from '@/components/chat/Composer';
import styles from './Home.module.css';

export default function Home() {
  const { name, email } = useCurrentUser();
  const {
    chats, activeChat, activeChatId, messages, isProcessing, processingChatIds,
    selectChat, startNewChat, sendQuestion, rateAnswer, togglePin, renameChat, deleteChat,
  } = useChats(email);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const inputRef = useRef(null);

  const firstName = (name || '').split(' ')[0];
  const isEmpty = messages.length === 0;

  useEffect(() => {
    if (isMobileViewport()) setSidebarOpen(false);
  }, []);

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
    <div className={styles.appShell}>
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

      <main className={styles.container}>
        {isEmpty && <div className={styles.ambient} aria-hidden="true" />}

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
              onFeedback={rateAnswer}
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
