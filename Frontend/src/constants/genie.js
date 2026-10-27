// Base URL of the FastAPI backend's Genie router (app/routers/genie.py).
export const GENIE_API_BASE =
  import.meta.env.VITE_GENIE_API_BASE_URL || 'http://localhost:8000/api/v1/genie';

// Genie's MessageStatus codes after which it stops working on an answer. Every other code
// (FETCHING_METADATA, ASKING_AI, EXECUTING_QUERY, ...) is progress, shown as Genie sends it.
export const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED', 'QUERY_RESULT_EXPIRED'];
export const FAILED_STATUSES = ['FAILED', 'CANCELLED', 'QUERY_RESULT_EXPIRED'];

// Polling backs off from 1s to 2s (short enough to catch each progress step) and gives up after 10 minutes.
export const POLL_INITIAL_DELAY_MS = 1000;
export const POLL_MAX_DELAY_MS = 2000;
export const POLL_TIMEOUT_MS = 10 * 60 * 1000;

// Below this width the sidebar overlays the chat instead of sitting beside it.
export const MOBILE_QUERY = '(max-width: 768px)';
