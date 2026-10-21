"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useCurrentUser } from '@/auth/useCurrentUser';
import { LogOutIcon } from './icons';
import styles from './UserMenu.module.css';

export const getInitials = (name, email) => {
  const source = name || email || '?';
  const parts = source.split(/[\s._@-]+/).filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[1][0] : source.slice(0, 2);
  return initials.toUpperCase();
};

// Top-right avatar: opens a menu with the signed-in user's details and Logout.
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
      <button
        className={styles.avatarButton}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={name || email}
      >
        <span className={styles.avatar}>{getInitials(name, email)}</span>
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.userInfo}>
            <span className={`${styles.avatar} ${styles.avatarLarge}`}>{getInitials(name, email)}</span>
            <div className={styles.userText}>
              <div className={styles.userName}>{name || 'Signed in'}</div>
              {email && <div className={styles.userEmail}>{email}</div>}
            </div>
          </div>
          <div className={styles.divider} />
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
