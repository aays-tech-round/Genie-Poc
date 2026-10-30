import { cn } from '@/lib/utils';

// Genie brand mark: magic lamp with a four-point star rising out of it.
// The artwork lives in public/genie-logo.svg; swap that file to change the logo everywhere.
const LOGO_SRC = '/genie-logo.svg';

// The bare lamp, sized by className (login page).
export function GenieMark({ className }) {
  return <img className={className} src={LOGO_SRC} alt="" aria-hidden="true" />;
}

// The lamp on a tile (chat app avatar and branding). Size it with className, e.g. size-7.
export default function GenieLogo({ className }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-[25%] border border-line bg-main', className)}
      aria-hidden="true"
    >
      <GenieMark className="size-3/4" />
    </span>
  );
}
