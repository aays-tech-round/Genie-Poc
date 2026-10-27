import { MOBILE_QUERY } from '@/constants/genie';

// Joins class names, skipping falsy ones: cn('a', isOpen && 'b') -> 'a b' or 'a'.
export const cn = (...classes) => classes.filter(Boolean).join(' ');

// Shows an API code as words without rewording it, so the UI never claims text Genie
// didn't send: 'FETCHING_METADATA' -> 'Fetching metadata', 'ASKING_AI' -> 'Asking AI',
// 'data_sourcing' -> 'Data sourcing'. Short words (AI, ID) stay upper case.
export const formatCode = (code) =>
  String(code)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((w, i) => (w.length <= 2 ? w.toUpperCase() : i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

export const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

// Sidebar title for a new chat, taken from its first question.
export const titleFrom = (text) => (text.length > 40 ? `${text.slice(0, 40).trim()}…` : text);

// "Shubham Raturi" -> "SR"; falls back to the email when there is no name.
export const getInitials = (name, email) => {
  const source = name || email || '?';
  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return initials.toUpperCase();
};

// Browser-only: true when the sidebar should overlay the chat.
export const isMobileViewport = () => window.matchMedia(MOBILE_QUERY).matches;
