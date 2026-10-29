import DataGraph from './DataGraph';
import FloatingCards from './FloatingCards';

// Decorative showcase: the data graph with analytics cards floating over it.
export default function DataVisual() {
  return (
    // Takes whatever height is left in the column; the visual inside scales to fit it,
    // so the left side never grows past the screen.
    <div
      className="grid min-h-0 flex-[1_1_0] place-items-center [container-type:size] max-[900px]:h-[clamp(220px,48vw,360px)] max-[900px]:max-w-[520px] max-[900px]:flex-none"
      aria-hidden="true"
    >
      {/* --u is resolved inside the cards, so 100cqw is this element's width: 1px at the full 620px */}
      <div className="relative aspect-[560/400] w-[min(100cqw,140cqh,620px)] [container-type:inline-size] [--u:calc(100cqw/620)]">
        <DataGraph />

        {/* Floating analytics elements */}
        <FloatingCards />
      </div>
    </div>
  );
}
