import { useEffect, useRef } from 'react';
import { FAILED_STATUSES } from '@/constants/genie';
import ChatBubble from './ChatBubble';

// Scrollable conversation. Adds a waiting placeholder while the question is in flight
// and offers "Try again" on a failed latest answer.
export default function MessageList({ chatId, messages, isProcessing, onRetry, onAsk }) {
  const scrollerRef = useRef(null);
  const scrolledChatIdRef = useRef(null);

  // Show the waiting indicator as soon as a question is sent, before /ask returns.
  const awaitingReply = isProcessing && messages[messages.length - 1]?.role === 'user';
  const displayed = awaitingReply ? [...messages, { role: 'genie' }] : messages;

  // Glide to new messages within a chat; jump straight to the bottom when switching chats.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const sameChat = scrolledChatIdRef.current === chatId;
    scrolledChatIdRef.current = chatId;
    el.scrollTo({ top: el.scrollHeight, behavior: sameChat ? 'smooth' : 'auto' });
  }, [messages, chatId]);

  // "Try again" is offered on the latest answer only, and re-asks the question before it.
  const lastIdx = displayed.length - 1;
  const last = displayed[lastIdx];
  const retryQuestion =
    !isProcessing && last?.role === 'genie' && FAILED_STATUSES.includes(last.status)
      ? [...displayed].reverse().find((m) => m.role === 'user')?.content
      : null;

  return (
    <div
      ref={scrollerRef}
      className="flex min-h-0 flex-1 justify-center overflow-y-auto scrollbar-thin px-4 py-7 max-md:px-3.5 max-md:py-4"
    >
      <div className="flex h-fit w-full max-w-[960px] flex-col gap-7 pb-8 max-lg:max-w-[720px] max-md:gap-[1.4rem] max-md:pb-4">
        {displayed.map((msg, idx) => (
          <ChatBubble
            // Genie replies are keyed by position so the waiting placeholder
            // turns into the real reply in place instead of remounting.
            key={msg.role === 'genie' ? `${chatId}-genie-${idx}` : msg.id || idx}
            message={msg}
            onRetry={idx === lastIdx && retryQuestion ? () => onRetry(retryQuestion) : null}
            // Follow-up suggestions only under the latest answer, and not while Genie is busy
            onAsk={idx === lastIdx && !isProcessing ? onAsk : null}
          />
        ))}
      </div>
    </div>
  );
}
