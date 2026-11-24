import { GENIE_API_BASE } from '@/constants/genie';
import { getToken } from '@/auth/authConfig';

// Thrown when the backend answers with an HTTP error, so callers can tell it apart
// from a network failure (which is worth retrying).
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Best error text the backend gave us: FastAPI's `detail`, then `message`, then the HTTP status.
const errorFrom = async (res) => {
  try {
    const json = await res.json();
    const detail = json.detail || json.message;
    if (detail) return typeof detail === 'string' ? detail : JSON.stringify(detail);
  } catch {
    // Not JSON; fall through to the status text.
  }
  return res.statusText || `Request failed (${res.status})`;
};

const messageFor = async (res) => {
  if (res.status === 401) return 'Your session has expired or is invalid. Please sign out and sign in again.';
  if (res.status === 403) return "You don't have access to Genie. Contact your administrator.";
  return errorFrom(res);
};

// Every call carries the signed-in user's access token; the backend rejects calls without one.
const request = async (path, options = {}) => {
  const token = await getToken();
  const res = await fetch(`${GENIE_API_BASE}${path}`, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError(await messageFor(res), res.status);
  return res.json();
};

/**
 * Sends a question. Resolves to { message_id, conversation_id } on success,
 * or throws an Error carrying the backend's message.
 */
export function askGenie(content, conversationId) {
  return request('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, conversation_id: conversationId }),
  });
}

// Current state of an answer: status, status_message, summary, data, error, ...
// Throws ApiError when the backend returns an HTTP error.
export function getMessageStatus(messageId, conversationId) {
  const params = new URLSearchParams({ conversation_id: conversationId });
  return request(`/status/${encodeURIComponent(messageId)}?${params}`);
}

// The signed-in user's chats, newest first: [{ id, conversation_id, title, is_pinned, created_at, updated_at }].
export function getChats() {
  return request('/chats');
}

// A chat's questions and answers, oldest first. Each item has the same fields as getMessageStatus
// plus message_id and content (the question).
export function getChatMessages(conversationId) {
  return request(`/chats/${encodeURIComponent(conversationId)}/messages`);
}

// Object URLs of Genie-rendered charts already downloaded, by attachment, so reopening a chat
// or switching tabs doesn't download the same image again. Failures aren't kept, so a later
// render can try again.
const visualizationUrls = new Map();

/**
 * Downloads the chart Genie rendered for a visualization attachment ({ message_id,
 * conversation_id, attachment_id } as returned in `visualization`). Resolves to an object URL
 * for an <img>; throws ApiError when the backend can't provide it.
 */
export function getVisualizationUrl({ message_id: messageId, conversation_id: conversationId, attachment_id: attachmentId }) {
  const key = `${conversationId}/${messageId}/${attachmentId}`;
  if (!visualizationUrls.has(key)) {
    const params = new URLSearchParams({ conversation_id: conversationId });
    const path = `/visualization/${encodeURIComponent(messageId)}/${encodeURIComponent(attachmentId)}?${params}`;
    const pending = (async () => {
      const token = await getToken();
      const res = await fetch(`${GENIE_API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new ApiError(await messageFor(res), res.status);
      const blob = await res.blob();
      if (!blob.type.startsWith('image/') || blob.size === 0) throw new ApiError('Not an image', res.status);
      return URL.createObjectURL(blob);
    })();
    pending.catch(() => visualizationUrls.delete(key));
    visualizationUrls.set(key, pending);
  }
  return visualizationUrls.get(key);
}

// Saves a new title and/or pin state: updateChatSettings(id, { title }) or ({ is_pinned }).
export function updateChatSettings(conversationId, changes) {
  return request(`/chats/${encodeURIComponent(conversationId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
}

// Permanently deletes a chat, in Genie and in the chat list. Throws ApiError (404 = already gone).
export function deleteChat(conversationId) {
  return request(`/chats/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
}
