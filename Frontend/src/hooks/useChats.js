import { useCallback, useEffect, useState } from 'react';
import {
  GENIE_STEPS, POLL_INITIAL_DELAY_MS, POLL_MAX_DELAY_MS, POLL_TIMEOUT_MS, TERMINAL_STATUSES,
} from '@/constants/genie';
import { askGenie, getMessageStatus } from '@/lib/genieApi';
import { loadChats, saveChats } from '@/lib/chatStorage';
import { makeId, titleFrom } from '@/lib/utils';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Appends a polled status to the message's progress steps (shown in the Thoughts panel).
// Steps shorter than the poll interval (up to 2s) can be skipped; that's fine for a summary.
const nextSteps = (steps = [], status) => {
  // ASKING_AI after the query has run means Genie is writing the answer
  const step = status === 'ASKING_AI' && steps.includes('EXECUTING_QUERY') ? 'SUMMARIZING' : status;
  if (!GENIE_STEPS[step] || steps[steps.length - 1] === step) return steps;
  return [...steps, step];
};

/**
 * Chat history for one user plus the Genie question/answer flow:
 * POST /ask, then poll /status until the answer reaches a terminal status.
 * History persists to localStorage; several chats can be answering at once.
 */
export default function useChats(email) {
  const [chats, setChats] = useState(() => loadChats(email));
  const [chatsEmail, setChatsEmail] = useState(email);
  const [activeChatId, setActiveChatId] = useState(null);
  const [processingChatIds, setProcessingChatIds] = useState(() => new Set());

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat ? activeChat.messages : [];
  const conversationId = activeChat ? activeChat.conversationId : null;
  const isProcessing = activeChatId ? processingChatIds.has(activeChatId) : false;

  // A different signed-in user gets their own history
  if (email !== chatsEmail) {
    setChatsEmail(email);
    setChats(loadChats(email));
  }

  useEffect(() => {
    saveChats(email, chats);
  }, [chats, email]);

  const updateChat = useCallback((chatId, update) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? update(c) : c)));
  }, []);

  const setChatProcessing = (chatId, busy) => {
    setProcessingChatIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(chatId); else next.delete(chatId);
      return next;
    });
  };

  const updateMessage = (chatId, msgId, data) => {
    updateChat(chatId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.message_id === msgId ? { ...m, ...data } : m)),
    }));
  };

  const applyStatus = (chatId, msgId, data) => {
    updateChat(chatId, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.message_id === msgId ? { ...m, ...data, steps: nextSteps(m.steps, data.status) } : m
      ),
    }));
  };

  const appendMessage = (chatId, message, extra = {}) => {
    updateChat(chatId, (c) => ({
      ...c,
      ...extra,
      messages: [...c.messages, message],
      updatedAt: Date.now(),
    }));
  };

  const pollStatus = async (msgId, currentConvId, chatId) => {
    let delay = POLL_INITIAL_DELAY_MS;
    const startTime = Date.now();

    while (Date.now() - startTime < POLL_TIMEOUT_MS) {
      try {
        const data = await getMessageStatus(msgId, currentConvId);
        applyStatus(chatId, msgId, data);

        if (TERMINAL_STATUSES.includes(data.status)) {
          setChatProcessing(chatId, false);
          return;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }

      await wait(delay);
      delay = Math.min(delay * 2, POLL_MAX_DELAY_MS);
    }

    updateMessage(chatId, msgId, { status: 'FAILED', status_message: 'Timed out' });
    setChatProcessing(chatId, false);
  };

  // Asks in the open chat, or starts a new chat when none is open.
  const sendQuestion = async (content) => {
    if (!content.trim() || isProcessing) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = makeId();
      setChats((prev) => [{
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
      const { message_id: newMsgId, conversation_id: newConvId } = await askGenie(content, conversationId);

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
        status_message: err.message || 'Failed to connect to backend',
      });
      setChatProcessing(chatId, false);
    }
  };

  const togglePin = (chatId) => updateChat(chatId, (c) => ({ ...c, pinned: !c.pinned }));

  const renameChat = (chatId, title) => updateChat(chatId, (c) => ({ ...c, title }));

  const deleteChat = (chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    if (chatId === activeChatId) setActiveChatId(null);
  };

  return {
    chats,
    activeChat,
    activeChatId,
    messages,
    isProcessing,
    processingChatIds,
    selectChat: setActiveChatId,
    startNewChat: () => setActiveChatId(null),
    sendQuestion,
    togglePin,
    renameChat,
    deleteChat,
  };
}
