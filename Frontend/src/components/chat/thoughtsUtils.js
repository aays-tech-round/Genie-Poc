// True when a Genie message has anything for the Thoughts panel to show.
export const hasInsights = (m) =>
  Boolean(m.steps?.length || m.thoughts?.length || m.sql);
