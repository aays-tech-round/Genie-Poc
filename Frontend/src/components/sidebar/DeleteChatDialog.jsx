import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';

const button =
  'inline-flex min-w-[88px] items-center justify-center gap-2 rounded-full border px-4 py-[0.45rem] text-sm font-medium transition active:scale-96 disabled:cursor-not-allowed disabled:opacity-60';

export default function DeleteChatDialog({ chat, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const confirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(chat.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not delete this chat.');
      setDeleting(false);
    }
  };

  return (
    <Modal
      // Can't be dismissed while the delete is running
      onClose={deleting ? () => {} : onClose}
      label="Delete chat"
      overlayClassName="items-center px-4 backdrop-blur-[3px]"
      className="w-[420px] p-6"
    >
      <h2 className="text-lg font-semibold text-primary">Delete this chat?</h2>
      <p className="mt-2 text-sm leading-normal text-secondary wrap-anywhere">
        &ldquo;{chat.title}&rdquo; and all its messages will be permanently deleted. This can&apos;t be undone.
      </p>
      {error && (
        <p className="mt-3 text-sm text-danger wrap-anywhere" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          className={`${button} border-line bg-main text-primary enabled:hover:bg-line`}
          onClick={onClose}
          disabled={deleting}
          autoFocus
        >
          Cancel
        </button>
        <button
          type="button"
          className={`${button} border-danger bg-danger text-white enabled:hover:opacity-90`}
          onClick={confirm}
          disabled={deleting}
        >
          {deleting ? <Spinner tone="inverse" className="size-4" aria-hidden="true" /> : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}
