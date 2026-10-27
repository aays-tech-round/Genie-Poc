import { GenieMark } from '@/components/ui/GenieLogo';

// Genie lamp whose star twinkles on the login page; only the star moves, the lamp stays put.
export default function TwinklingGenieIcon({ className }) {
  return (
    <GenieMark
      className={className}
      starClassName="origin-center transform-fill animate-[starTwinkle_2.4s_ease-in-out_infinite]"
    />
  );
}
