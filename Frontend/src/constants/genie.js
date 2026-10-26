// Base URL of the FastAPI backend's Genie router (app/routers/genie.py).
export const GENIE_API_BASE =
  import.meta.env.VITE_GENIE_API_BASE_URL || 'http://localhost:8000/api/v1/genie';

// Message statuses after which Genie stops working on an answer.
export const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];
export const FAILED_STATUSES = ['FAILED', 'CANCELLED'];

// Polling backs off from 1s to 2s (short enough to catch each progress step) and gives up after 10 minutes.
export const POLL_INITIAL_DELAY_MS = 1000;
export const POLL_MAX_DELAY_MS = 2000;
export const POLL_TIMEOUT_MS = 10 * 60 * 1000;

// Below this width the sidebar overlays the chat instead of sitting beside it.
export const MOBILE_QUERY = '(max-width: 768px)';

// Progress steps shown in the Thoughts panel, keyed by Genie message status.
// SUMMARIZING is client-side: Genie reports ASKING_AI again after the query runs,
// when it is writing the answer. `active` shows while running, `done` afterwards.
export const GENIE_STEPS = {
  SUBMITTED: { active: 'Sending your question', done: 'Sent your question' },
  FETCHING_METADATA: { active: 'Reading table metadata', done: 'Read table metadata' },
  FILTERING_CONTEXT: { active: 'Finding relevant context', done: 'Found relevant context' },
  ASKING_AI: { active: 'Working out the query', done: 'Worked out the query' },
  PENDING_WAREHOUSE: { active: 'Starting the SQL warehouse', done: 'Started the SQL warehouse' },
  EXECUTING_QUERY: { active: 'Running the SQL query', done: 'Ran the SQL query' },
  SUMMARIZING: { active: 'Writing the answer', done: 'Wrote the answer' },
};

// Headings for Genie's thoughts (backend sends the ThoughtType without its prefix).
export const THOUGHT_LABELS = {
  understanding: 'Understanding the question',
  data_sourcing: 'Data sources',
  instructions: 'Instructions applied',
  steps: 'Approach',
  description: 'Summary',
};
