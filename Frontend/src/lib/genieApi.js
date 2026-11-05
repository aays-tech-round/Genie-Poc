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
