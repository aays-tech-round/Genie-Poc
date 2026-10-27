import { GENIE_API_BASE } from '@/constants/genie';

const postJson = (path, body) =>
  fetch(`${GENIE_API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

// Best error text the backend gave us: FastAPI's `detail`, then `message`, then the HTTP status.
const errorFrom = async (res) => {
  try {
    const json = await res.json();
    return json.detail || json.message || res.statusText;
  } catch {
    return res.statusText;
  }
};

/**
 * Sends a question. Resolves to { message_id, conversation_id } on success,
 * or throws an Error carrying the backend's message.
 */
export async function askGenie(content, conversationId) {
  const res = await postJson('/ask', { content, conversation_id: conversationId });
  if (!res.ok) throw new Error(await errorFrom(res));
  return res.json();
}

// Current state of an answer: Genie's status code, plus summary, data, sql, thoughts, error, ...
export async function getMessageStatus(messageId, conversationId) {
  const res = await fetch(`${GENIE_API_BASE}/status/${messageId}?conversation_id=${conversationId}`);
  return res.json();
}
