"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';
import ChatBubble from '../../components/ChatBubble';
import Sidebar from '../../components/Sidebar';
import UserMenu from '../../components/UserMenu';
import { ArrowUpIcon, NewChatIcon, PlusIcon, SidebarIcon } from '../../components/icons';
import { useCurrentUser } from '@/auth/useCurrentUser';

const API_BASE = 'http://localhost:8000/api/v1/genie';
const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const titleFrom = (text) => (text.length > 40 ? `${text.slice(0, 40).trim()}…` : text);

// Chat history is kept in this browser's localStorage, one list per signed-in user.
const storageKey = (email) => `genie-chats:${email || 'anonymous'}`;

const loadChats = (email) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(email)) || '[]');
    // Polling stops when the page unloads, so answers that were still running are lost.
    return saved.map((chat) => ({
      ...chat,
      messages: chat.messages.map((m) =>
        m.role === 'genie' && !TERMINAL_STATUSES.includes(m.status)
          ? { ...m, status: 'FAILED', status_message: 'Interrupted' }
          : m
      ),
    }));
  } catch {
    return [];
  }
};

export default function Home() {
  const { name, email } = useCurrentUser();
  const [chats, setChats] = useState([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [processingChatIds, setProcessingChatIds] = useState(() => new Set());
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const chatWindowRef = useRef(null);
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat ? activeChat.messages : [];
  const conversationId = activeChat ? activeChat.conversationId : null;
  const isProcessing = activeChatId ? processingChatIds.has(activeChatId) : false;
  const firstName = (name || '').split(' ')[0];

  useEffect(() => {
    setChats(loadChats(email));
    setChatsLoaded(true);
    if (window.matchMedia('(max-width: 768px)').matches) setSidebarOpen(false);
  }, [email]);

  useEffect(() => {
    if (!chatsLoaded) return;
    try {
      localStorage.setItem(storageKey(email), JSON.stringify(chats));
    } catch (err) {
      console.error('Failed to save chat history:', err);
    }
  }, [chats, chatsLoaded, email]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const updateChat = useCallback((chatId, update) => {
    setChats(prev => prev.map(c => (c.id === chatId ? update(c) : c)));
  }, []);

  const setChatProcessing = (chatId, busy) => {
    setProcessingChatIds(prev => {
      const next = new Set(prev);
      if (busy) next.add(chatId); else next.delete(chatId);
      return next;
    });
  };

  const updateMessage = (chatId, msgId, data) => {
    updateChat(chatId, c => ({
      ...c,
      messages: c.messages.map(m => (m.message_id === msgId ? { ...m, ...data } : m)),
    }));
  };

  const appendMessage = (chatId, message, extra = {}) => {
    updateChat(chatId, c => ({
      ...c,
      ...extra,
      messages: [...c.messages, message],
      updatedAt: Date.now(),
    }));
  };

  const pollStatus = async (msgId, currentConvId, chatId) => {
    let waitTime = 1000;
    const maxWait = 5000;
    const startTime = Date.now();
    const timeout = 10 * 60 * 1000;

    while (Date.now() - startTime < timeout) {
      try {
        const res = await fetch(`${API_BASE}/status/${msgId}?conversation_id=${currentConvId}`);
        const data = await res.json();

        updateMessage(chatId, msgId, data);

        if (TERMINAL_STATUSES.includes(data.status)) {
          setChatProcessing(chatId, false);
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      await new Promise(resolve => setTimeout(resolve, waitTime));
      waitTime = Math.min(waitTime * 2, maxWait);
    }

    updateMessage(chatId, msgId, { status: 'FAILED', status_message: 'Timed out' });
    setChatProcessing(chatId, false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const content = inputValue;
    setInputValue('');

    // The first question starts a new chat in the sidebar.
    let chatId = activeChatId;
    if (!chatId) {
      chatId = makeId();
      setChats(prev => [{
        id: chatId,
        title: titleFrom(content),
        conversationId: null,
        messages: [],
        pinned: false,
        updatedAt: Date.now(),
      }, ...prev]);
      setActiveChatId(chatId);
    }

    setChatProcessing(chatId, true);
    appendMessage(chatId, { role: 'user', content, id: Date.now().toString() });

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          conversation_id: conversationId
        })
      });

      if (!res.ok) {
        let errorData = res.statusText;
        try {
          const jsonError = await res.json();
          errorData = jsonError.detail || jsonError.message || errorData;
        } catch (_) {}

        appendMessage(chatId, { role: 'genie', status: 'FAILED', status_message: errorData });
        setChatProcessing(chatId, false);
        return;
      }

      const sessionData = await res.json();
      const newMsgId = sessionData.message_id;
      const newConvId = sessionData.conversation_id;

      appendMessage(
        chatId,
        { role: 'genie', message_id: newMsgId, status: 'STARTING', status_message: 'Message Sent' },
        { conversationId: conversationId || newConvId }
      );

      pollStatus(newMsgId, newConvId, chatId);

    } catch (err) {
      appendMessage(chatId, {
        role: 'genie',
        status: 'FAILED',
        status_message: err.message || 'Failed to connect to backend'
      });
      setChatProcessing(chatId, false);
    }
  };

  const handleFeedback = async (msgId, rating) => {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message_id: msgId,
          rating: rating
        })
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  const closeSidebarOnMobile = () => {
    if (window.matchMedia('(max-width: 768px)').matches) setSidebarOpen(false);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInputValue('');
    closeSidebarOnMobile();
    inputRef.current?.focus();
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    closeSidebarOnMobile();
  };

  const handleTogglePin = (chatId) => updateChat(chatId, c => ({ ...c, pinned: !c.pinned }));

  const handleRename = (chatId, title) => updateChat(chatId, c => ({ ...c, title }));

  const handleDelete = (chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (chatId === activeChatId) setActiveChatId(null);
  };

  const inputForm = (
    <form className={styles.inputArea} onSubmit={handleSend}>
      <button type="button" className={styles.iconButton} aria-label="Add Attachment">
        <PlusIcon size={20} />
      </button>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ask Genie anything"
        className={styles.inputField}
        disabled={isProcessing}
      />
      <button
        type="submit"
        className={styles.sendButton}
        disabled={!inputValue.trim() || isProcessing}
        aria-label="Send"
      >
        <ArrowUpIcon size={18} />
      </button>
    </form>
  );

  return (
    <div className={styles.appShell}>
      <Sidebar
        open={sidebarOpen}
        chats={chats}
        activeChatId={activeChatId}
        onSelect={handleSelectChat}
        onNewChat={handleNewChat}
        onTogglePin={handleTogglePin}
        onRename={handleRename}
        onDelete={handleDelete}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <main className={styles.container}>
        <header className={styles.topNav}>
          <div className={styles.topNavLeft}>
            {!sidebarOpen && (
              <>
                <button className={styles.navIconBtn} onClick={() => setSidebarOpen(true)} title="Open sidebar">
                  <SidebarIcon />
                </button>
                <button className={styles.navIconBtn} onClick={handleNewChat} title="New chat">
                  <NewChatIcon />
                </button>
              </>
            )}
          </div>
          <UserMenu />
        </header>

        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <h1 className={styles.greeting}>
              {firstName ? `Hey ${firstName}! What are we tackling today?` : 'What are we tackling today?'}
            </h1>
            <div className={styles.inputWrapper}>{inputForm}</div>
          </div>
        ) : (
          <>
            <div className={styles.chatWindow} ref={chatWindowRef}>
              <div className={styles.chatWindowInner}>
                {messages.map((msg, idx) => (
                  <ChatBubble
                    key={msg.message_id || msg.id || idx}
                    message={msg}
                    onFeedback={handleFeedback}
                  />
                ))}
              </div>
            </div>
            <div className={styles.inputWrapper}>
              {inputForm}
              <div className={styles.footerText}>
                Databricks Genie can make mistakes. Check important info.
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
