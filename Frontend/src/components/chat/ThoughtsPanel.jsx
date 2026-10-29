import { useState } from 'react';
import { TERMINAL_STATUSES } from '@/constants/genie';
import { Check, ChevronDown, Code, Copy, Database, Lightbulb, ListChecks } from 'lucide-react';
import Markdown from '@/components/ui/Markdown';
import TypingDots from '@/components/ui/TypingDots';
import StepFlow from './StepFlow';
import { cn, formatCode } from '@/lib/utils';

const sectionTitle =
  'inline-flex items-center gap-[0.4rem] text-xs font-semibold tracking-[0.04em] text-accent uppercase';

// What Genie is doing now: its current status code, or null before it has reported one.
const currentStatus = (message) =>
  message.status && !TERMINAL_STATUSES.includes(message.status) ? formatCode(message.status) : null;

function SqlBlock({ sql, parameters }) {
  const [copied, setCopied] = useState(false);
  const text = sql.replace(/\r\n?/g, '\n').trim();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context): the SQL is still selectable
    }
  };

  return (
    <div className="flex animate-fade flex-col gap-[0.45rem]">
      <div className="flex items-center justify-between">
        <span className={sectionTitle}><Code size={14} /> Generated SQL</span>
        <button
          type="button"
          className="inline-flex items-center gap-[0.3rem] rounded-md px-2 py-[0.2rem] text-xs text-secondary transition hover:bg-line hover:text-primary"
          onClick={copy}
          aria-label="Copy SQL"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {parameters?.length > 0 && (
        <div className="flex flex-wrap gap-[0.35rem]">
          {parameters.map((p) => (
            <span
              key={p.keyword}
              className="rounded-full bg-accent-soft px-2 py-[0.15rem] font-mono text-xs text-primary"
              title={p.sql_type || undefined}
            >
              <span className="text-accent">:{p.keyword}</span> = {String(p.value)}
            </span>
          ))}
        </div>
      )}
      <pre className="max-h-80 overflow-auto rounded-[10px] border border-line bg-soft px-[0.9rem] py-3 font-mono text-[0.8rem] leading-[1.6] whitespace-pre text-primary scrollbar-thin">
        <code>{text}</code>
      </pre>
    </div>
  );
}

/**
 * How Genie got to an answer, built only from what the Genie API returns: the status
 * codes it reported while working (in order), its thoughts, the query title and
 * description, and the SQL. Everything updates on each poll. While `live` it is open;
 * once the answer arrives it collapses to a one-line summary the user can expand.
 */
export default function ThoughtsPanel({ message, live }) {
  const [open, setOpen] = useState(live);
  const [wasLive, setWasLive] = useState(live);
  const steps = message.steps || [];
  const thoughts = message.thoughts || [];
  const status = currentStatus(message);

  // Fold away when the answer lands (the bubble stays mounted across that change)
  if (live !== wasLive) {
    setWasLive(live);
    if (!live) setOpen(false);
  }

  const hasBody = steps.length > 0 || thoughts.length > 0 || Boolean(message.sql);
  const summary = [
    steps.length && `${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`,
    message.sql && 'SQL',
  ].filter(Boolean).join(' · ');

  return (
    <div className="mb-3 animate-fade">
      <button
        type="button"
        className="-ml-[0.4rem] inline-flex min-h-7 items-center gap-2 rounded-lg py-[0.2rem] pr-[0.55rem] pl-[0.4rem] text-left text-sm text-secondary transition enabled:hover:bg-line enabled:hover:text-primary"
        onClick={() => hasBody && setOpen((o) => !o)}
        aria-expanded={hasBody ? open : undefined}
        disabled={!hasBody}
      >
        {live ? (
          <>
            <TypingDots
              className="inline-flex h-4 items-center gap-1"
              dotClassName="size-1.5 animate-[typingDot_1.3s_ease-in-out_infinite_both]"
              aria-hidden="true"
            />
            {/* Genie's current status code; until it reports one, only the dots show.
                key restarts the fade when the status changes. */}
            <span
              key={status || 'waiting'}
              className={cn(
                'animate-[fadeOnly_0.35s_ease_both] text-[0.9rem] text-secondary motion-safe:animate-[fadeOnly_0.35s_ease_both,shimmer_2.2s_linear_infinite] motion-safe:bg-[linear-gradient(90deg,var(--secondary)_30%,var(--primary)_50%,var(--secondary)_70%)] motion-safe:bg-size-[200%_100%] motion-safe:bg-clip-text motion-safe:text-transparent',
                !status && 'sr-only'
              )}
              role="status"
              aria-live="polite"
            >
              {status || 'Waiting for Genie'}
            </span>
          </>
        ) : (
          <>
            <Lightbulb size={15} className="shrink-0 text-accent" />
            <span className="font-medium">Thoughts</span>
            {summary && <span className="text-secondary before:mr-2 before:content-['·']">{summary}</span>}
          </>
        )}
        {hasBody && (
          <ChevronDown
            size={15}
            className={cn('shrink-0 text-secondary transition-transform duration-250 ease-smooth', open && 'rotate-180')}
          />
        )}
      </button>

      {/* grid-template-rows 0fr -> 1fr animates the height without measuring it */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-smooth',
          open && hasBody ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-2 mb-1 ml-[0.45rem] flex flex-col gap-[0.85rem] border-l-2 border-line py-[0.1rem] pl-4">
            {steps.length > 0 && (
              <div className="flex flex-col gap-[0.45rem]">
                <span className={sectionTitle}><ListChecks size={14} /> Steps</span>
                <StepFlow steps={steps} live={live} />
              </div>
            )}

            {(message.query_title || message.query_description) && (
              <div className="flex animate-fade flex-col gap-[0.35rem]">
                {message.query_title && (
                  <div className="text-[0.9rem] font-semibold text-primary">{message.query_title}</div>
                )}
                {message.query_description && <Markdown text={message.query_description} />}
              </div>
            )}

            {thoughts.map((t, i) => (
              <div key={i} className="flex animate-fade flex-col gap-[0.35rem]">
                {/* Heading is Genie's thought type, e.g. data_sourcing -> "Data sourcing" */}
                {t.type && (
                  <div className={sectionTitle}>
                    {t.type === 'data_sourcing' ? <Database size={14} /> : <Lightbulb size={14} />}
                    {formatCode(t.type)}
                  </div>
                )}
                {/* Thought text stays at the panel's smaller size; Markdown headings keep theirs */}
                <div className="text-sm text-secondary [&_:not(h3,h4,h5,h6)]:text-[length:inherit]">
                  <Markdown text={t.content} />
                </div>
              </div>
            ))}

            {message.sql && <SqlBlock sql={message.sql} parameters={message.sql_parameters} />}
          </div>
        </div>
      </div>
    </div>
  );
}
