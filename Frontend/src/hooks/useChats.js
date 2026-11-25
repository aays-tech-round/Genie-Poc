import { useCallback, useEffect, useRef, useState } from 'react';
import {
  POLL_INITIAL_DELAY_MS, POLL_MAX_DELAY_MS, POLL_TIMEOUT_MS, TERMINAL_STATUSES,
} from '@/constants/genie';
import {
  ApiError, askGenie, deleteChat as deleteChatRequest, getChatMessages, getChats, getMessageStatus,
  updateChatSettings,
} from '@/lib/genieApi';
import { mergeChats, messagesFromBackend } from '@/lib/chatMapping';
import { makeId, titleFrom } from '@/lib/utils';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const nextSteps = (steps = [], status) =>
  !status || TERMINAL_STATUSES.includes(status) || steps[steps.length - 1] === status
    ? steps
    : [...steps, status];


export default function useChats(email) {
  const [chats, setChats] = useState([]);
  const [chatsEmail, setChatsEmail] = useState(email);
  // True until the chat list for the signed-in user has come back from the backend
  const [chatsLoading, setChatsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [processingChatIds, setProcessingChatIds] = useState(() => new Set());
  // Latest chats for code that runs after an await, where the state in scope may be stale
  const chatsRef = useRef(chats);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const messages = activeChat ? activeChat.messages : [];
  const conversationId = activeChat ? activeChat.conversationId : null;
  const isProcessing = activeChatId ? processingChatIds.has(activeChatId) : false;
  // An open chat whose messages haven't arrived yet (loading, or failed to load)
  const isUnloaded = !!activeChat && !activeChat.loaded;

  // A different signed-in user gets their own history
  if (email !== chatsEmail) {
    setChatsEmail(email);
    setChats([]);
    setActiveChatId(null);
    setChatsLoading(true);
  }

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    let cancelled = false;
    getChats()
      .then((remote) => {
        if (!cancelled) setChats((prev) => mergeChats(prev, remote));
      })
      .catch((err) => console.error('Could not load the chat list:', err))
      .finally(() => {
        if (!cancelled) setChatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [email]);

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
        // The backend answered with an error (e.g. 401/403/500): retrying won't help, so stop and show it.
        if (err instanceof ApiError) {
          updateMessage(chatId, msgId, { status: 'FAILED', status_message: err.message, error: err.message });
          setChatProcessing(chatId, false);
          return;
        }
        console.error('Polling error:', err);
      }

      await wait(delay);
      delay = Math.min(delay * 2, POLL_MAX_DELAY_MS);
    }

    updateMessage(chatId, msgId, { status: 'FAILED', error: 'No answer from Genie after 10 minutes' });
    setChatProcessing(chatId, false);
  };

  // Reads an opened chat's questions and answers from Genie. Answers that were still being
  // worked on (e.g. the page was closed meanwhile) carry on polling.
  const loadMessages = (chat) => {
    updateChat(chat.id, (c) => ({ ...c, loading: true, loadError: null }));
    getChatMessages(chat.conversationId)
      .then((items) => {
        updateChat(chat.id, (c) => ({
          ...c,
          messages: messagesFromBackend(items).map((m) =>
            m.role === 'genie' ? { ...m, steps: nextSteps([], m.status) } : m
          ),
          loaded: true,
          loading: false,
        }));
        const unfinished = items.filter((m) => !TERMINAL_STATUSES.includes(m.status));
        if (unfinished.length > 0) {
          setChatProcessing(chat.id, true);
          unfinished.forEach((m) => pollStatus(m.message_id, chat.conversationId, chat.id));
        }
      })
      .catch((err) => {
        console.error('Could not load the chat:', err);
        updateChat(chat.id, (c) => ({
          ...c,
          loading: false,
          loadError: err.message || 'Could not load this chat.',
        }));
      });
  };

  const selectChat = (chatId) => {
    setActiveChatId(chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (chat && !chat.loaded && !chat.loading && chat.conversationId) loadMessages(chat);
  };

  const reloadActiveChat = () => {
    if (activeChat && !activeChat.loading) loadMessages(activeChat);
  };

  // Saves a pin or rename. Until a brand-new chat's first answer has started it has no
  // conversation to save to; syncNewChat saves its changes once /ask returns.
  const saveSettings = (chat, changes, undo) => {
    if (!chat.conversationId) return;
    updateChatSettings(chat.conversationId, changes).catch((err) => {
      console.error('Could not save the chat change:', err);
      updateChat(chat.id, (c) => ({ ...c, ...undo }));
    });
  };

  const syncNewChat = (chatId, newConversationId, originalTitle) => {
    const chat = chatsRef.current.find((c) => c.id === chatId);
    if (!chat) return;
    const changes = {};
    if (chat.title !== originalTitle) changes.title = chat.title;
    if (chat.pinned) changes.is_pinned = true;
    if (Object.keys(changes).length === 0) return;
    updateChatSettings(newConversationId, changes).catch((err) =>
      console.error('Could not save the chat change:', err)
    );
  };

  // Asks in the open chat, or starts a new chat when none is open.
  const sendQuestion = async (content) => {
    if (!content.trim() || isProcessing || isUnloaded) return;

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
        loaded: true,
      }, ...prev]);
      setActiveChatId(chatId);
    }

    setChatProcessing(chatId, true);
    appendMessage(chatId, { role: 'user', content, id: Date.now().toString() });

    try {
      const { message_id: newMsgId, conversation_id: newConvId } = await askGenie(content, conversationId);

      appendMessage(
        chatId,
        // No status until the first poll: the UI shows a plain loading indicator meanwhile
        { role: 'genie', message_id: newMsgId },
        { conversationId: conversationId || newConvId }
      );
      if (!conversationId) syncNewChat(chatId, newConvId, titleFrom(content));

      pollStatus(newMsgId, newConvId, chatId);
    } catch (err) {
      appendMessage(chatId, {
        role: 'genie',
        status: 'FAILED',
        error: err.message || 'Failed to connect to backend',
      });
      setChatProcessing(chatId, false);
    }
  };

  const togglePin = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    const pinned = !chat.pinned;
    updateChat(chatId, (c) => ({ ...c, pinned }));
    saveSettings(chat, { is_pinned: pinned }, { pinned: chat.pinned });
  };

  const renameChat = (chatId, title) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    updateChat(chatId, (c) => ({ ...c, title }));
    saveSettings(chat, { title }, { title: chat.title });
  };

  // Deletes a chat for good. The chat leaves the list only once the backend has deleted it, so a
  // failure throws (the caller shows it) and the chat stays. A 404 means it is already gone.
  const deleteChat = async (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    if (chat.conversationId) {
      try {
        await deleteChatRequest(chat.conversationId);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
    }
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveChatId((current) => (current === chatId ? null : current));
    setChatProcessing(chatId, false);
  };

  return {
    chats,
    chatsLoading,
    activeChat,
    activeChatId,
    messages,
    isProcessing,
    isUnloaded,
    loadError: activeChat?.loadError || null,
    processingChatIds,
    selectChat,
    reloadActiveChat,
    startNewChat: () => setActiveChatId(null),
    sendQuestion,
    togglePin,
    renameChat,
    deleteChat,
  };
}
