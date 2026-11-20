// Turns what the backend returns into the chat and message objects the UI works with.

// A chat from the backend list. Its messages are loaded when it is opened (loaded: false until then).
export const chatFromBackend = (chat) => ({
  id: chat.id,
  title: chat.title,
  conversationId: chat.conversation_id,
  messages: [],
  pinned: chat.is_pinned,
  updatedAt: Date.parse(chat.updated_at),
  loaded: false,
});

// The backend returns one item per question with Genie's answer; the UI shows them as two bubbles.
export const messagesFromBackend = (items) =>
  items.flatMap(({ content, ...answer }) => [
    { role: 'user', content, id: `${answer.message_id}-question` },
    { role: 'genie', ...answer },
  ]);

// The backend list plus the chats already in memory. A chat in memory wins, since it was started
// or changed in this session and holds its messages; the others come from the backend.
export const mergeChats = (inMemory, remote) => {
  const known = new Set(inMemory.map((c) => c.conversationId).filter(Boolean));
  return [...inMemory, ...remote.filter((r) => !known.has(r.conversation_id)).map(chatFromBackend)];
};
