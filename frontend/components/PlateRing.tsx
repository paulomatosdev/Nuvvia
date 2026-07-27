import { MacroGoal } from "@/lib/types";

const COLOR_MAP: Record<MacroGoal["colorVar"], string> = {
  forest: "#1F3A2E",
  plum: "#8B3560",
  mustard: "#C99A2E",
  teal: "#2C7873",
};

/**
 * Anel de prato: cada macro ocupa um arco proporcional à meta diária,
 * e o preenchimento do arco mostra o quanto já foi consumido.
 * É a metáfora central do produto — o "prato" dividido em porções.
 */
export function PlateRing({ macros, size = 120 }: { macros: MacroGoal[]; size?: number }) {
  const radius = size / 2 - 10;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / macros.length;
  const gap = 6;

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Progresso de macros do dia">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#DCE0D6" strokeWidth={9} />
      {macros.map((macro) => {
        const pct = Math.min(macro.consumed / macro.target, 1);
        const arcLength = segmentLength - gap;
        const filled = arcLength * pct;
        const dashArray = `${filled} ${circumference}`;
        const rotation = (offset / circumference) * 360 - 90;
        offset += segmentLength;

        return (
          <circle
            key={macro.label}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={COLOR_MAP[macro.colorVar]}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={dashArray}
            transform={`rotate(${rotation} ${center} ${center})`}
          />
        );
      })}
      <text
        x={center}
        y={center - 2}
        textAnchor="middle"
        className="fill-ink font-display"
        style={{ fontSize: size * 0.16 }}
      >
        {Math.round(
          (macros.reduce((acc, m) => acc + Math.min(m.consumed / m.target, 1), 0) / macros.length) * 100
        )}
        %
      </text>
      <text x={center} y={center + size * 0.14} textAnchor="middle" className="fill-ink/60 font-body" style={{ fontSize: size * 0.08 }}>
        da meta
      </text>
    </svg>
  );
}
