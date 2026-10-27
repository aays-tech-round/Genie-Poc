import { cn } from '@/lib/utils';
import { databricksLogo } from './assets';

// Data-graph layout for the showcase visualization (SVG viewBox 560 x 400).
const HUB = { x: 290, y: 200 };
const NODES = [
  { x: 70, y: 150, r: 5 },
  { x: 120, y: 290, r: 6, pulse: true },
  { x: 175, y: 95, r: 4 },
  { x: 230, y: 340, r: 4 },
  { x: 330, y: 60, r: 5, pulse: true },
  { x: 410, y: 120, r: 4 },
  { x: 470, y: 230, r: 6 },
  { x: 395, y: 330, r: 5, pulse: true },
  { x: 515, y: 345, r: 4 },
  { x: 505, y: 70, r: 3.5 },
];
// Pairs of NODES indexes linked to each other (every node also links to the hub).
const LINKS = [
  [0, 2],
  [0, 1],
  [1, 3],
  [2, 4],
  [4, 5],
  [5, 9],
  [5, 6],
  [6, 8],
  [6, 7],
  [7, 3],
];

// Slightly bowed curve between two points, so edges read as flowing lines.
const curve = (a, b, bend = 0.18) => {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const cx = mx - (b.y - a.y) * bend;
  const cy = my + (b.x - a.x) * bend;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
};

// Edge from node i into the hub; neighbouring edges bow in opposite directions.
const hubEdge = (n, i) => curve(n, HUB, i % 2 ? 0.14 : -0.14);

// Dashes streaming along an edge into the hub; every third is slower, every fourth runs backwards.
const flowAnimation = (i) =>
  [
    i % 3 === 0 ? 'animate-[graphFlow_4.2s_linear_infinite]' : 'animate-[graphFlow_2.8s_linear_infinite]',
    i % 4 === 1 && '[animation-direction:reverse]',
  ];

// Network of data sources streaming into the Databricks hub.
export default function DataGraph() {
  return (
    <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 560 400" role="presentation">
      {/* Static edges */}
      {NODES.map((n, i) => (
        <path
          key={`e-h-${i}`}
          className="fill-none stroke-line stroke-[1.25]"
          d={hubEdge(n, i)}
        />
      ))}
      {LINKS.map(([a, b]) => (
        <path
          key={`e-${a}-${b}`}
          className="fill-none stroke-line stroke-[1.25]"
          d={curve(NODES[a], NODES[b], 0.1)}
        />
      ))}

      {/* Animated data flowing into the hub */}
      {NODES.map((n, i) => (
        <path
          key={`f-${i}`}
          className={cn(
            'fill-none stroke-[1.75] stroke-accent [stroke-dasharray:3_14] [stroke-linecap:round]',
            ...flowAnimation(i)
          )}
          d={hubEdge(n, i)}
        />
      ))}

      {/* Hub */}
      <circle
        className="origin-center transform-fill animate-[hubBreathe_5s_ease-in-out_infinite] fill-accent-soft"
        cx={HUB.x}
        cy={HUB.y}
        r="90"
      />
      <circle
        className="origin-center transform-fill animate-[spin_24s_linear_infinite] fill-none stroke-accent stroke-1 [stroke-dasharray:2_6]"
        cx={HUB.x}
        cy={HUB.y}
        r="44"
      />
      <circle
        className="fill-main stroke-accent stroke-[1.5] drop-shadow-md"
        cx={HUB.x}
        cy={HUB.y}
        r="26"
      />
      <image href={databricksLogo} x={HUB.x - 15} y={HUB.y - 15} width="30" height="30" />

      {/* Nodes */}
      {NODES.map((n, i) => (
        <g key={`n-${i}`}>
          {n.pulse && (
            <circle
              className="origin-center transform-fill animate-[nodePulse_3.2s_ease-out_infinite] fill-accent-soft"
              cx={n.x}
              cy={n.y}
              r={n.r + 4}
              style={{ animationDelay: `${i * 0.6}s` }}
            />
          )}
          <circle className="fill-main stroke-accent stroke-[1.5]" cx={n.x} cy={n.y} r={n.r + 3} />
          <circle className="fill-accent" cx={n.x} cy={n.y} r={n.r - 1} />
        </g>
      ))}
    </svg>
  );
}
