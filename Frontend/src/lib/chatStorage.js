import { TERMINAL_STATUSES } from '@/constants/genie';

// Chat history is kept in this browser's localStorage, one list per signed-in user.
const storageKey = (email) => `genie-chats:${email || 'anonymous'}`;

export function loadChats(email) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(email)) || '[]');
    // Polling stops when the page unloads, so answers that were still running are lost.
    return saved.map((chat) => ({
      ...chat,
      messages: chat.messages.map((m) =>
        m.role === 'genie' && !TERMINAL_STATUSES.includes(m.status)
          ? { ...m, status: 'FAILED', error: 'Interrupted: the page was closed before Genie answered' }
          : m
      ),
    }));
  } catch {
    return [];
  }
}

export function saveChats(email, chats) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(chats));
  } catch (err) {
    console.error('Failed to save chat history:', err);
  }
}
