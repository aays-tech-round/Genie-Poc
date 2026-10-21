"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import { ChevronDownIcon, LogOutIcon } from './icons';
import styles from './UserMenu.module.css';

export const getInitials = (name, email) => {
  const source = name || email || '?';
  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return initials.toUpperCase();
};

// Account row at the bottom of the sidebar: shows who is signed in and opens a menu with Log out.
export default function UserMenu() {
  const { instance } = useMsal();
  const { name, email } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.wrapper} ref={menuRef}>
      {open && (
        <div className={styles.menu} role="menu">
          {email && <div className={styles.menuEmail}>{email}</div>}
          <button
            className={styles.menuItem}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirmLogout(true);
            }}
          >
            <LogOutIcon size={18} />
            Log out
          </button>
        </div>
      )}

      <button
        className={`${styles.accountButton} ${open ? styles.accountButtonOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar}>{getInitials(name, email)}</span>
        <span className={styles.userText}>
          <span className={styles.userName}>{name || 'Signed in'}</span>
          {email && <span className={styles.userEmail}>{email}</span>}
        </span>
        <ChevronDownIcon size={16} className={styles.chevron} />
      </button>

      {confirmLogout && (
        <div className={styles.backdrop} onClick={() => setConfirmLogout(false)}>
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2 className={styles.dialogTitle}>Are you sure you want to log out?</h2>
            <p className={styles.dialogText}>Log out of Genie as {email || name}?</p>
            <div className={styles.dialogActions}>
              <button className={styles.secondaryBtn} onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
              {/* Ends the Entra ID session and returns to postLogoutRedirectUri */}
              <button className={styles.primaryBtn} onClick={() => instance.logoutRedirect()}>
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
