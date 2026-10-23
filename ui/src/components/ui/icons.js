// Inline stroke icons (lucide-style) so the app needs no icon package.
const Icon = ({ children, size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const SearchIcon = (p) => (
  <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Icon>
);

export const SidebarIcon = (p) => (
  <Icon {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></Icon>
);

export const NewChatIcon = (p) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </Icon>
);

export const PinIcon = (p) => (
  <Icon {...p}>
    <path d="M12 17v5" />
    <path d="M9 10.8V5h6v5.8l2.5 3.2v1.5h-11V14Z" />
  </Icon>
);

export const MoreIcon = (p) => (
  <Icon {...p}><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></Icon>
);

export const EditIcon = (p) => (
  <Icon {...p}><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Icon>
);

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </Icon>
);

export const ChatIcon = (p) => (
  <Icon {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" /></Icon>
);

export const ChevronDownIcon = (p) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);

export const LogOutIcon = (p) => (
  <Icon {...p}>
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
  </Icon>
);

export const CloseIcon = (p) => (
  <Icon {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
);

export const ArrowUpIcon = (p) => (
  <Icon {...p}><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></Icon>
);

export const PlusIcon = (p) => (
  <Icon {...p}><path d="M12 5v14" /><path d="M5 12h14" /></Icon>
);

export const ThumbsUpIcon = (p) => (
  <Icon {...p}>
    <path d="M7 10v11" />
    <path d="M15 5.9 14 10h5.8a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 18.4 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h2.8a2 2 0 0 0 1.8-1.1L12 2a3.1 3.1 0 0 1 3 3.9Z" />
  </Icon>
);

export const ThumbsDownIcon = (p) => (
  <Icon {...p}>
    <path d="M17 14V3" />
    <path d="M9 18.1 10 14H4.2a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 5.6 3H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2.8a2 2 0 0 0-1.8 1.1L12 22a3.1 3.1 0 0 1-3-3.9Z" />
  </Icon>
);

export const AlertIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></Icon>
);

export const SunIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p) => (
  <Icon {...p}><path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a6.6 6.6 0 0 0 10.6 10.6Z" /></Icon>
);

export const RetryIcon = (p) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 21v-5h5" />
  </Icon>
);

export const WarningIcon = (p) => (
  <Icon {...p}>
    <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export const TrendIcon = (p) => (
  <Icon {...p}><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></Icon>
);

export const SparklesIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3 13.9 8.1 19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
    <path d="M19 15v4M17 17h4" />
  </Icon>
);

export const TargetIcon = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Icon>
);

export const BarChartIcon = (p) => (
  <Icon {...p}><path d="M3 3v18h18" /><path d="M8 17v-5" /><path d="M13 17V8" /><path d="M18 17v-9" /></Icon>
);

export const DocumentIcon = (p) => (
  <Icon {...p}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" />
    <path d="M14 3v6h6" />
    <path d="M8 13h8M8 17h5" />
  </Icon>
);

// Genie mark: magic lamp with a four-point star, on a white tile.
export const GenieLogo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <rect
      x=".75" y=".75" width="46.5" height="46.5" rx="12" strokeWidth="1.5"
      style={{ fill: 'var(--logo-tile, #fff)', stroke: 'var(--logo-tile-stroke, #E7E8EE)' }}
    />
    <g transform="translate(6.6 7.9) scale(.75)">
      <path fill="#F25C3F" d="M28 3.5Q29.4 11.6 36 12.5 29.4 13.4 28 21.5 26.6 13.4 20 12.5 26.6 11.6 28 3.5Z" />
      <path
        fill="#FBB8AD"
        d="M42.5 24C42.5 30.5 36 35 28.5 35 23 35 19 32.5 15.5 29.5 12.5 27 10 24.6 6.3 25 4.6 25.2 3.8 23.6 5.1 22.6 8.8 20 13.5 21.8 17 24Z"
      />
      <path fill="#F25C3F" d="M25 34.5h7v1.5h-7z" />
      <path fill="#F25C3F" d="M20.5 39c0-1.4 1.1-2.5 2.5-2.5h11c1.4 0 2.5 1.1 2.5 2.5v.5h-16Z" />
    </g>
  </svg>
);
