// Base URL of the FastAPI backend's Genie router (app/routers/genie.py).
export const GENIE_API_BASE =
  process.env.NEXT_PUBLIC_GENIE_API_BASE_URL || 'http://localhost:8000/api/v1/genie';

// Message statuses after which Genie stops working on an answer.
export const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];
export const FAILED_STATUSES = ['FAILED', 'CANCELLED'];

// Polling backs off from 1s to 5s and gives up after 10 minutes.
export const POLL_INITIAL_DELAY_MS = 1000;
export const POLL_MAX_DELAY_MS = 5000;
export const POLL_TIMEOUT_MS = 10 * 60 * 1000;

// Below this width the sidebar overlays the chat instead of sitting beside it.
export const MOBILE_QUERY = '(max-width: 768px)';
