import { useCallback, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import useDismiss from '@/hooks/useDismiss';
import { ChevronDown, LogOut } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { Menu, MenuItem } from '@/components/ui/Menu';
import Modal from '@/components/ui/Modal';
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
        <Menu className="right-0 bottom-[calc(100%+6px)] left-0 origin-bottom">
          {email && (
            <div className="mb-1 truncate border-b border-line px-[0.6rem] pt-[0.45rem] pb-2 text-[0.78rem] text-secondary">
              {email}
            </div>
          )}
          <MenuItem
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmLogout(true);
            }}
          >
            <LogOut size={18} />
            Log out
          </MenuItem>
        </Menu>
      )}

      <button
        className={cn(
          'flex w-full items-center gap-[0.65rem] rounded-[10px] px-[0.6rem] py-2 text-left transition-colors',
          open ? 'bg-line' : 'hover:bg-line'
        )}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} email={email} className="size-8 text-[0.72rem]" />
        <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
          <span className="truncate text-sm font-medium text-primary">{name || 'Signed in'}</span>
          {email && <span className="truncate text-xs text-secondary">{email}</span>}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-secondary transition-transform duration-200 ease-smooth', !open && 'rotate-180')}
        />
      </button>

      {/* No closeOnEscape: this dialog has never closed on Escape */}
      {confirmLogout && (
        <Modal
          onClose={() => setConfirmLogout(false)}
          overlayClassName="items-center p-4 backdrop-blur-[2px]"
          className="w-[400px] p-6"
        >
          <h2 className="mb-2 text-[1.1rem] font-semibold">Are you sure you want to log out?</h2>
          <p className="mb-6 text-[0.9rem] wrap-break-word text-secondary">Log out of Genie as {email || name}?</p>
          <div className="flex justify-end gap-2">
            <button
              className={cn(dialogButton, 'border border-secondary text-primary hover:bg-line')}
              onClick={() => setConfirmLogout(false)}
            >
              Cancel
            </button>
            {/* Ends the Entra ID session and returns to postLogoutRedirectUri */}
            <button
              className={cn(dialogButton, 'bg-danger text-main hover:opacity-90')}
              onClick={() => instance.logoutRedirect()}
            >
              Log out
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
