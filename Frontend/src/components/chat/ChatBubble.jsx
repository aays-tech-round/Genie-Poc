import { useCurrentUser } from '@/auth/useCurrentUser';
import { FAILED_STATUSES } from '@/constants/genie';
import { formatCode } from '@/lib/utils';
import { CircleAlert, RefreshCw } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import GenieLogo from '@/components/ui/GenieLogo';
import Markdown from '@/components/ui/Markdown';
import ResultView from '@/components/results/ResultView';
import ThoughtsPanel from './ThoughtsPanel';
import { hasInsights } from './thoughtsUtils';
import FollowUps from './FollowUps';

const bubble = 'relative text-[0.975rem] leading-[1.65] wrap-anywhere max-sm:text-[0.95rem]';

// onAsk is only passed for the latest answer, so follow-up suggestions show there alone.
export default function ChatBubble({ message, onRetry, onAsk }) {
  const isUser = message.role === 'user';
  const { name, email } = useCurrentUser();

  const failed = FAILED_STATUSES.includes(message.status);
  // Genie's own error text; for CANCELLED / QUERY_RESULT_EXPIRED, which carry none, the code itself
  const failureDetail = message.error || (message.status !== 'FAILED' ? formatCode(message.status) : null);
  const working = !isUser && message.status !== 'COMPLETED' && !failed;

  if (isUser) {
    return (
      // The sent question rises from the composer
      <div className="flex w-full animate-[userIn_0.35s_var(--ease-smooth)_both] items-start justify-end gap-[0.6rem]">
        <div className={`${bubble} max-w-[min(78%,620px)] rounded-[20px_6px_20px_20px] border border-accent-soft bg-accent-soft px-[1.1rem] py-[0.65rem] whitespace-pre-wrap shadow-sm max-sm:max-w-[82%]`}>
          {message.content}
        </div>
        <Avatar
          name={name}
          email={email}
          className="mt-2 size-[30px] text-[0.7rem] shadow-md select-none max-sm:size-[26px] max-sm:text-[0.62rem]"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="flex w-full animate-fade-up items-start justify-start gap-3.5 max-sm:gap-[0.6rem]">
      <div className="mt-[0.15rem] size-7 shrink-0 rounded-[9px] shadow-sm max-sm:size-6 max-sm:[&_svg]:size-6">
        <GenieLogo size={28} />
      </div>

      <div className={`${bubble} max-w-full min-w-0 flex-1 pt-[0.15rem]`}>
        {message.trusted_asset && (
          <div className="mb-[0.6rem] inline-flex items-center gap-1 rounded-full bg-soft px-[0.55rem] py-[0.2rem] text-[0.68rem] font-semibold tracking-[0.5px] text-success uppercase">
            <span aria-hidden="true">✓</span> Verified
          </div>
        )}

        {/* Stays mounted from waiting to the answer, so it can fold away smoothly */}
        {(working || hasInsights(message)) && <ThoughtsPanel message={message} live={working} />}

        {/* Each state mounts its own element, so the answer fades in when polling completes */}
        {message.status === 'COMPLETED' ? (
          <div className="animate-answer">
            <Markdown text={message.summary} />
            {message.data && <ResultView data={message.data} />}
            {onAsk && <FollowUps questions={message.suggested_questions} onAsk={onAsk} />}
          </div>
        ) : failed ? (
          <div
            className="flex animate-[answerIn_0.35s_var(--ease-smooth)_both] items-start gap-[0.6rem] rounded-xl border border-danger bg-main px-[0.9rem] py-3 text-[0.9rem] leading-normal text-danger"
            role="alert"
          >
            <CircleAlert size={18} className="mt-px shrink-0 text-danger" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">Genie failed to process this request.</div>
              {failureDetail && (
                <div className="mt-[0.15rem] text-[0.85rem] opacity-80">{failureDetail}</div>
              )}
            </div>
            {onRetry && (
              <button
                type="button"
                className="inline-flex shrink-0 items-center gap-[0.35rem] self-center rounded-full border border-danger bg-main px-3 py-[0.35rem] text-[0.8rem] font-medium text-primary transition hover:border-secondary hover:bg-line active:scale-96"
                onClick={onRetry}
              >
                <RefreshCw size={14} /> Try again
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
