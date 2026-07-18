// components/ui/Sparkline.tsx — plain inline SVG per the dataviz skill's mark specs:
// 2px line, round cap/join, ~10% opacity area wash, filled end-dot with a surface
// ring. Single series -> no legend/axes needed (the label beside it names it).
'use client';

export function Sparkline({
  data,
  color = '#0b0b0b',
  height = 40,
  className = '',
  showEndDot = true,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
  showEndDot?: boolean;
  fill?: boolean;
}) {
  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center text-[11px] text-stone-400 ${className}`}
        style={{ height }}
      >
        —
      </div>
    );
  }

  const w = 100;
  const h = 40;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
    >
      {fill && <path d={areaPath} fill={color} opacity={0.12} stroke="none" />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showEndDot && (
        <circle cx={lastX} cy={lastY} r={3.2} fill={color} stroke="#fcfcfb" strokeWidth={1.5} />
      )}
    </svg>
  );
}
