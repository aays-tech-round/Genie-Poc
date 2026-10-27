import { useCallback, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import useDismiss from '@/hooks/useDismiss';
import { getInitials } from '@/lib/utils';
import { ChevronDown, LogOut } from 'lucide-react';
import { menuItem } from '@/components/ui/classes';
import { cn } from '@/lib/utils';

const dialogButton = 'rounded-full px-4 py-[0.55rem] text-[0.9rem] font-medium transition-colors';

// Account row at the bottom of the sidebar: shows who is signed in and opens a menu with Log out.
export default function UserMenu() {
  const { instance } = useMsal();
  const { name, email } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef(null);

  useDismiss(menuRef, open, useCallback(() => setOpen(false), []));

  return (
    <div className="relative" ref={menuRef}>
      {open && (
        // Opens upward from the account row
        <div
          className="absolute right-0 bottom-[calc(100%+6px)] left-0 z-40 origin-bottom animate-menu rounded-xl border border-line bg-elevated p-[5px] shadow-lg"
          role="menu"
        >
          {email && (
            <div className="mb-1 truncate border-b border-line px-[0.6rem] pt-[0.45rem] pb-2 text-[0.78rem] text-secondary">
              {email}
            </div>
          )}
          <button
            className={cn(menuItem, 'text-primary')}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmLogout(true);
            }}
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      )}

      <button
        className={cn(
          'flex w-full items-center gap-[0.65rem] rounded-[10px] px-[0.6rem] py-2 text-left transition-colors',
          open ? 'bg-hover' : 'hover:bg-hover'
        )}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(image:--accent-gradient) text-[0.72rem] font-semibold tracking-[0.3px] text-white">
          {getInitials(name, email)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <span className="truncate text-sm font-medium text-primary">{name || 'Signed in'}</span>
          {email && <span className="truncate text-xs text-tertiary">{email}</span>}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-tertiary transition-transform duration-200 ease-smooth', !open && 'rotate-180')}
        />
      </button>

      {confirmLogout && (
        <div
          className="fixed inset-0 z-60 flex animate-backdrop items-center justify-center bg-overlay p-4 backdrop-blur-[2px]"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-[400px] max-w-full animate-dialog rounded-2xl bg-elevated p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="mb-2 text-[1.1rem] font-semibold">Are you sure you want to log out?</h2>
            <p className="mb-6 text-[0.9rem] wrap-break-word text-secondary">Log out of Genie as {email || name}?</p>
            <div className="flex justify-end gap-2">
              <button
                className={cn(dialogButton, 'border border-strong text-primary hover:bg-hover')}
                onClick={() => setConfirmLogout(false)}
              >
                Cancel
              </button>
              {/* Ends the Entra ID session and returns to postLogoutRedirectUri */}
              <button
                className={cn(dialogButton, 'bg-[#ff3621] text-white hover:bg-[#e02e1a]')}
                onClick={() => instance.logoutRedirect()}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
