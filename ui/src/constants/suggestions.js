// Starter questions shown on a new chat. Clicking one sends it to Genie as-is, so
// phrase them the way a user would ask. Keep it to four so the welcome screen fits
// without scrolling. `icon` is a key into SUGGESTION_ICONS and `tone` (violet, blue,
// teal, amber, rose) colours its badge; both are defined in components/chat/Suggestions.*.
export const SUGGESTED_QUESTIONS = [
  { icon: 'target', tone: 'violet', text: 'Which part has the maximum potential in 2025 for which country?' },
  { icon: 'chart', tone: 'blue', text: 'What is the exports benchmark for this part?' },
  { icon: 'trend', tone: 'teal', text: 'What is the YTD Net Revenue for 2025 and 2026 and what is the change %?' },
  { icon: 'sparkles', tone: 'amber', text: 'Which are the top 5 parts by Net Revenue in 2026?' },
];
