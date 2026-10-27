// Genie brand mark: magic lamp with a four-point star rising out of it.
// A brand logo rather than a generic icon, so it isn't in lucide-react.
const LampPaths = ({ starClassName }) => (
  <>
    <path
      className={starClassName}
      fill="#F25C3F"
      d="M28 3.5Q29.4 11.6 36 12.5 29.4 13.4 28 21.5 26.6 13.4 20 12.5 26.6 11.6 28 3.5Z"
    />
    <path
      fill="#FBB8AD"
      d="M42.5 24C42.5 30.5 36 35 28.5 35 23 35 19 32.5 15.5 29.5 12.5 27 10 24.6 6.3 25 4.6 25.2 3.8 23.6 5.1 22.6 8.8 20 13.5 21.8 17 24Z"
    />
    <path fill="#F25C3F" d="M25 34.5h7v1.5h-7z" />
    <path fill="#F25C3F" d="M20.5 39c0-1.4 1.1-2.5 2.5-2.5h11c1.4 0 2.5 1.1 2.5 2.5v.5h-16Z" />
  </>
);

// The bare lamp, sized by CSS (login page).
export function GenieMark({ className, starClassName }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <LampPaths starClassName={starClassName} />
    </svg>
  );
}

// The lamp on a tile (chat app avatar and branding).
export default function GenieLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect
        x=".75" y=".75" width="46.5" height="46.5" rx="12" strokeWidth="1.5"
        className="fill-main stroke-line"
      />
      <g transform="translate(6.6 7.9) scale(.75)">
        <LampPaths />
      </g>
    </svg>
  );
}
