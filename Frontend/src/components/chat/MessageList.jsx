import { useEffect, useRef } from 'react';
import { FAILED_STATUSES } from '@/constants/genie';
import ChatBubble from './ChatBubble';
import styles from './MessageList.module.css';

// Scrollable conversation. Adds a "thinking" placeholder while the question is in flight
// and offers "Try again" on a failed latest answer.
export default function MessageList({ chatId, messages, isProcessing, onFeedback, onRetry, onAsk }) {
  const scrollerRef = useRef(null);
  const scrolledChatIdRef = useRef(null);

  // Show "Genie is thinking…" as soon as a question is sent, before /ask returns.
  const awaitingReply = isProcessing && messages[messages.length - 1]?.role === 'user';
  const displayed = awaitingReply ? [...messages, { role: 'genie', status: 'PENDING' }] : messages;

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
    <div className={styles.scroller} ref={scrollerRef}>
      <div className={styles.inner}>
        {displayed.map((msg, idx) => (
          <ChatBubble
            // Genie replies are keyed by position so the "thinking" placeholder
            // turns into the real reply in place instead of remounting.
            key={msg.role === 'genie' ? `${chatId}-genie-${idx}` : msg.id || idx}
            message={msg}
            onFeedback={onFeedback}
            onRetry={idx === lastIdx && retryQuestion ? () => onRetry(retryQuestion) : null}
            // Follow-up suggestions only under the latest answer, and not while Genie is busy
            onAsk={idx === lastIdx && !isProcessing ? onAsk : null}
          />
        ))}
      </div>
    </div>
  );
}
