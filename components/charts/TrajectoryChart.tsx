// components/charts/TrajectoryChart.tsx — the Load Index trajectory: a single
// sequential line over a fixed date domain, tier bands as reserved status color
// (always paired with a label), selective direct labels (endpoint + event pins),
// solid hairline grid, crosshair tooltip. Per the dataviz skill: sequential is the
// safe default for "trend over time, one series" — no categorical palette needed.
'use client';

import {
  ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceArea, ReferenceDot,
} from 'recharts';
import type { RiskTier } from '@/lib/types';
import { TIER_META } from '@/lib/branding';
import { formatDateMedium, formatDateShort, tierForLoadIndex } from '@/components/lib/format';

const BANDS: { tier: RiskTier; y1: number; y2: number }[] = [
  { tier: 'stable', y1: 0, y2: 34 },
  { tier: 'elevated', y1: 34, y2: 54 },
  { tier: 'high', y1: 54, y2: 69 },
  { tier: 'critical', y1: 69, y2: 100 },
];

const PIN_META: Record<string, { color: string; label: string }> = {
  coverage: { color: '#78716c', label: 'Coverage' },
  death: { color: '#dc2626', label: 'Death' },
  code: { color: '#dc2626', label: 'Code' },
  icu_transfer: { color: '#dc2626', label: 'ICU transfer' },
  trigger: { color: '#d97706', label: 'Trigger' },
  confirm: { color: '#ea580c', label: 'Body confirms' },
  near_miss: { color: '#ea580c', label: 'Near-miss' },
  catch: { color: '#7c3aed', label: 'Catch' },
  intervention: { color: '#0284c7', label: 'Intervention' },
  verify: { color: '#059669', label: 'Verified' },
  recovery: { color: '#059669', label: 'Recovery' },
};

export interface TrajectoryPoint { date: string; loadIndex: number | null }
export interface TrajectoryPin { date: string; loadIndex: number; kind: string; label: string }

interface TooltipPayloadItem { value?: number | null; payload: { date: string } }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  if (p.value === null || p.value === undefined) return null;
  const date = p.payload.date;
  const value = p.value;
  const meta = TIER_META[tierForLoadIndex(value)];
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-stone-500">{formatDateMedium(date)}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-semibold tabular-nums text-stone-900">{value}</span>
        <span className="font-medium" style={{ color: meta.color }}>{meta.label}</span>
      </p>
    </div>
  );
}

export function TrajectoryChart({
  data,
  pins,
  tier,
  height = 300,
}: {
  data: TrajectoryPoint[];
  pins: TrajectoryPin[];
  tier: RiskTier;
  height?: number;
}) {
  const lastPoint = [...data].reverse().find((d) => d.loadIndex !== null);
  const tierMeta = TIER_META[tier];

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {BANDS.map((b) => (
          <span key={b.tier} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TIER_META[b.tier].color }} />
            {TIER_META[b.tier].label}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 44, bottom: 4, left: -12 }}>
          <CartesianGrid horizontal vertical={false} stroke="#e1e0d9" strokeWidth={1} />
          {BANDS.map((b) => (
            <ReferenceArea
              key={b.tier}
              y1={b.y1}
              y2={b.y2}
              fill={TIER_META[b.tier].soft}
              fillOpacity={1}
              stroke="none"
              ifOverflow="visible"
            />
          ))}
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDateShort(d)}
            tick={{ fontSize: 11, fill: '#898781' }}
            axisLine={{ stroke: '#c3c2b7' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 50, 100]}
            tick={{ fontSize: 11, fill: '#898781' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
          {pins.map((pin, i) => {
            // Only the four story-critical pins carry on-chart text; the rest are
            // dots — their detail lives in the agent feed and the presenter's script.
            const major = ['trigger', 'confirm', 'catch', 'verify'].includes(pin.kind);
            const meta = PIN_META[pin.kind] ?? { color: '#78716c', label: pin.kind };
            return (
              <ReferenceDot
                key={`${pin.kind}-${pin.date}-${i}`}
                x={pin.date}
                y={pin.loadIndex}
                r={major ? 5 : 3.5}
                fill={meta.color}
                stroke="#fcfcfb"
                strokeWidth={major ? 2 : 1.5}
                ifOverflow="visible"
                label={
                  major
                    ? {
                        value: meta.label,
                        position: pin.kind === 'trigger' || pin.kind === 'confirm' ? 'bottom' : 'top',
                        fontSize: 11,
                        fontWeight: 600,
                        fill: meta.color,
                        offset: 10,
                      }
                    : undefined
                }
              />
            );
          })}
          <Line
            type="monotone"
            dataKey="loadIndex"
            stroke="#292524"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: '#fcfcfb', strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
          {lastPoint && (
            <ReferenceDot
              x={lastPoint.date}
              y={lastPoint.loadIndex as number}
              r={6}
              fill={tierMeta.color}
              stroke="#fcfcfb"
              strokeWidth={2}
              ifOverflow="visible"
              label={{
                value: `${lastPoint.loadIndex}`,
                position: 'right',
                fontSize: 13,
                fontWeight: 700,
                fill: tierMeta.color,
                offset: 10,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
