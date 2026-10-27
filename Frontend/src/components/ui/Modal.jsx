import useKeydown from '@/hooks/useKeydown';
import { cn } from '@/lib/utils';

// Dimmed full-screen backdrop with a dialog box on top. Clicking the backdrop closes it;
// Escape closes it only when closeOnEscape is set.
// overlayClassName positions the box (alignment, padding, blur); className sizes the box.
export default function Modal({ onClose, closeOnEscape = false, overlayClassName, className, children }) {
  useKeydown((e) => e.key === 'Escape' && onClose(), closeOnEscape);

  return (
    <div
      className={cn('fixed inset-0 z-60 flex animate-backdrop justify-center bg-overlay', overlayClassName)}
      onClick={onClose}
    >
      <div
        className={cn('max-w-full animate-dialog rounded-2xl bg-main shadow-xl', className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}
