/**
 * Charts for the affiliate portal.
 *
 * Hand-rolled SVG on purpose. A charting library would add 40-120KB to a
 * dashboard that needs exactly three shapes, and every one of them would have
 * to be re-skinned to match the portal anyway.
 *
 * Shared conventions:
 *  - Gold is the primary series. Secondary series step down to amber, then to a
 *    neutral white, so the eye always knows which line is the money.
 *  - Charts measure themselves (ResizeObserver) instead of stretching a fixed
 *    viewBox, so strokes stay 1px and labels stay legible at every width.
 *  - Nothing is drawn from an empty series. A chart with no data renders a
 *    stated empty state rather than a flat line at zero, which would read as
 *    "we measured zero" instead of "we have nothing".
 */
'use client';

import { useCallback, useEffect, useId as useReactId, useMemo, useRef, useState } from 'react';
import { LABEL } from './portal-ui';

export type Tone = 'gold' | 'amber' | 'success' | 'danger' | 'info' | 'neutral';

const TONE_HEX: Record<Tone, string> = {
  gold: '#E7C873',
  amber: '#D9932B',
  success: '#3ECF8E',
  danger: '#F2555A',
  info: '#6BA8F5',
  neutral: 'rgba(255,255,255,0.55)',
};

/** Width of the element, tracked live. 0 until the first measurement. */
function useMeasuredWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // ResizeObserver rather than a window listener: the sidebar collapsing
    // changes the chart's width without the window ever resizing.
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/**
 * Round an axis maximum up to something a human would have chosen (1, 2, 2.5 or
 * 5 x a power of ten). Without this the top gridline lands on 8 437 and the
 * chart looks like a readout rather than a report.
 */
function niceCeil(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export interface Series {
  key: string;
  label: string;
  values: number[];
  tone?: Tone;
  /** Draw as a line only, no gradient fill. Use for secondary comparisons. */
  lineOnly?: boolean;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Area / line chart
 * ──────────────────────────────────────────────────────────────────────────── */

export function AreaChart({
  labels,
  series,
  height = 260,
  formatValue,
  formatLabel,
  emptyText = 'No activity in this period yet.',
}: {
  /** One label per x position; must be the same length as every series. */
  labels: string[];
  series: Series[];
  height?: number;
  formatValue?: (v: number, s: Series) => string;
  formatLabel?: (l: string) => string;
  emptyText?: string;
}) {
  const { ref, width } = useMeasuredWidth<HTMLDivElement>();
  const uid = useReactId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const PAD = { l: 52, r: 14, t: 14, b: 26 };
  const innerW = Math.max(0, width - PAD.l - PAD.r);
  const innerH = Math.max(0, height - PAD.t - PAD.b);

  const scale = useMemo(() => {
    const all = series.flatMap((s) => s.values).filter((n) => Number.isFinite(n));
    const rawMax = all.length ? Math.max(...all) : 0;
    const rawMin = all.length ? Math.min(...all) : 0;
    // Negative values (profit/loss) need a zero line inside the plot, not at
    // the bottom edge, or a losing day is drawn as if it were break-even.
    const max = niceCeil(Math.max(rawMax, 0) || 1);
    const min = rawMin < 0 ? -niceCeil(Math.abs(rawMin)) : 0;
    return { max, min, span: max - min || 1 };
  }, [series]);

  const n = labels.length;
  const x = useCallback((i: number) => (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW), [n, innerW]);
  const y = useCallback(
    (v: number) => innerH - ((v - scale.min) / scale.span) * innerH,
    [innerH, scale],
  );

  const paths = useMemo(() => {
    if (!innerW || !innerH || n < 2) return [];
    return series
      .map((s) => {
        // A series shorter than the label row is not drawn. The area path closes
        // itself through the first and last points, so an empty or single-point
        // series used to index off the end of the array and throw — taking the
        // whole page down over one series the caller simply had no data for.
        const pts = s.values.slice(0, n).map((v, i) => [x(i), y(Number.isFinite(v) ? v : 0)] as const);
        if (pts.length < 2) return null;
        const line = pts.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
        const base = y(Math.max(scale.min, 0));
        const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${base.toFixed(1)} L${pts[0][0].toFixed(1)},${base.toFixed(1)} Z`;
        return { s, line, area };
      })
      .filter((p): p is { s: Series; line: string; area: string } => p !== null);
  }, [series, innerW, innerH, n, x, y, scale]);

  const hasData = series.some((s) => s.values.some((v) => Number.isFinite(v) && v !== 0));

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (n < 2 || !innerW) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - PAD.l;
    const i = Math.round((px / innerW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  // Roughly one tick per 90px, so the axis never collides with itself. The final
  // index is always labelled; any generated tick that would land within a label
  // width of it is dropped, otherwise the two overlap and read as "Jul 24Jul 25".
  const tickIdx = useMemo(() => {
    if (n <= 0) return [] as number[];
    if (n === 1) return [0];
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));
    const out: number[] = [];
    for (let i = 0; i < n - 1; i += every) out.push(i);
    const lastX = x(n - 1);
    while (out.length && lastX - x(out[out.length - 1]) < 46) out.pop();
    out.push(n - 1);
    return out;
  }, [n, innerW, x]);
  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((f) => scale.min + f * scale.span);

  return (
    <div className="relative w-full select-none" ref={ref} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={series.map((s) => s.label).join(', ')}>
          <defs>
            {series.map((s) => {
              const hex = TONE_HEX[s.tone ?? 'gold'];
              return (
                <linearGradient key={s.key} id={`fill-${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hex} stopOpacity="0.34" />
                  <stop offset="70%" stopColor={hex} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={hex} stopOpacity="0" />
                </linearGradient>
              );
            })}
          </defs>

          <g transform={`translate(${PAD.l},${PAD.t})`}>
            {/* Gridlines and the y axis. The zero line is brighter than the rest
                because crossing it is the only value change that flips meaning. */}
            {gridValues.map((gv, i) => {
              const gy = y(gv);
              const zero = Math.abs(gv) < 1e-9 && scale.min < 0;
              return (
                <g key={i}>
                  <line
                    x1={0}
                    x2={innerW}
                    y1={gy}
                    y2={gy}
                    stroke={zero ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.06)'}
                    strokeWidth={1}
                    shapeRendering="crispEdges"
                  />
                  <text x={-10} y={gy + 3.5} textAnchor="end" fontSize={10} fill="var(--text-muted)" className="tabular-nums">
                    {formatValue ? formatValue(gv, series[0]) : Math.round(gv).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {paths.map(({ s, line, area }) => (
              <g key={s.key}>
                {!s.lineOnly ? <path d={area} fill={`url(#fill-${uid}-${s.key})`} /> : null}
                <path
                  d={line}
                  fill="none"
                  stroke={TONE_HEX[s.tone ?? 'gold']}
                  strokeWidth={s.lineOnly ? 1.4 : 2}
                  strokeDasharray={s.lineOnly ? '4 3' : undefined}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* x labels */}
            {labels.map((l, i) =>
              tickIdx.includes(i) ? (
                <text key={i} x={x(i)} y={innerH + 17} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                  {formatLabel ? formatLabel(l) : l}
                </text>
              ) : null,
            )}

            {/* crosshair */}
            {hover !== null && n > 1 ? (
              <g pointerEvents="none">
                <line x1={x(hover)} x2={x(hover)} y1={0} y2={innerH} stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="3 3" />
                {series.map((s) => (
                  <circle
                    key={s.key}
                    cx={x(hover)}
                    cy={y(Number.isFinite(s.values[hover]) ? s.values[hover] : 0)}
                    r={3.5}
                    fill="var(--bg-base)"
                    stroke={TONE_HEX[s.tone ?? 'gold']}
                    strokeWidth={2}
                  />
                ))}
              </g>
            ) : null}
          </g>
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {/* Tooltip. A plain div rather than SVG text so it can wrap, use the app
          font stack and be clamped inside the card. */}
      {hover !== null && width > 0 && n > 1 ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[150px] rounded-xl border border-[var(--line-strong)] bg-[var(--scrim-tooltip)] px-3 py-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur"
          style={{ left: Math.min(Math.max(PAD.l + x(hover) - 75, 4), Math.max(4, width - 158)) }}
        >
          <p className="mb-1 text-[11px] font-semibold text-[var(--text-primary)]">
            {formatLabel ? formatLabel(labels[hover]) : labels[hover]}
          </p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center justify-between gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: TONE_HEX[s.tone ?? 'gold'] }} />
                {s.label}
              </span>
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                {formatValue ? formatValue(s.values[hover] ?? 0, s) : (s.values[hover] ?? 0).toLocaleString()}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      {!hasData ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-lg border border-[var(--line)] bg-[var(--scrim-panel)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
            {emptyText}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Legend for an AreaChart. Series can be toggled when `onToggle` is supplied. */
export function ChartLegend({
  series,
  hidden,
  onToggle,
}: {
  series: { key: string; label: string; tone?: Tone }[];
  hidden?: Set<string>;
  onToggle?: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((s) => {
        const off = hidden?.has(s.key);
        const dot = <span className="h-2 w-2 rounded-full" style={{ background: TONE_HEX[s.tone ?? 'gold'], opacity: off ? 0.3 : 1 }} />;
        const text = `text-[11px] font-medium transition-colors ${off ? 'text-[var(--text-faint)]' : 'text-[var(--text-secondary)]'}`;
        return onToggle ? (
          <button key={s.key} type="button" onClick={() => onToggle(s.key)} className={`flex items-center gap-1.5 ${text} hover:text-[var(--text-primary)]`}>
            {dot}
            {s.label}
          </button>
        ) : (
          <span key={s.key} className={`flex items-center gap-1.5 ${text}`}>
            {dot}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Funnel
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  hint?: string;
}

/**
 * Signup → deposit → playing.
 *
 * Each bar is measured against the FIRST stage, and the conversion percentage
 * shown beside it is against the PREVIOUS stage - those are different questions
 * and a funnel that conflates them is the classic way to overstate a middle
 * step. Both are labelled.
 */
export function Funnel({ stages, emptyText = 'No referrals yet.' }: { stages: FunnelStage[]; emptyText?: string }) {
  const top = stages[0]?.value ?? 0;
  if (!stages.length || top <= 0) {
    return <p className="py-6 text-center text-xs text-[var(--text-muted)]">{emptyText}</p>;
  }
  const tones: Tone[] = ['gold', 'amber', 'success', 'info'];
  return (
    <div className="space-y-3">
      {stages.map((st, i) => {
        const ofTop = (st.value / top) * 100;
        const prev = i === 0 ? null : stages[i - 1].value;
        const stepPct = prev ? (prev > 0 ? (st.value / prev) * 100 : 0) : null;
        const hex = TONE_HEX[tones[i % tones.length]];
        return (
          <div key={st.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {st.label}
                {st.hint ? <span className="ml-1.5 text-[10px] text-[var(--text-muted)]">{st.hint}</span> : null}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{st.value.toLocaleString()}</span>
                <span className="text-[10px] tabular-nums text-[var(--text-muted)]">{ofTop.toFixed(ofTop >= 10 ? 0 : 1)}% of top</span>
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(ofTop, st.value > 0 ? 1.5 : 0)}%`, background: `linear-gradient(90deg,${hex}99,${hex})` }}
              />
            </div>
            {stepPct !== null ? (
              <p className="mt-1 text-[10px] tabular-nums text-[var(--text-muted)]">
                {stepPct.toFixed(stepPct >= 10 ? 0 : 1)}% converted from {stages[i - 1].label.toLowerCase()}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Donut
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  tone?: Tone;
}

/** Composition at a glance. Slices under 1% are kept, but never labelled inline. */
export function Donut({
  slices,
  size = 132,
  centerLabel,
  centerValue,
  emptyText = 'Nothing to split yet.',
}: {
  slices: DonutSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  emptyText?: string;
}) {
  const total = slices.reduce((a, s) => a + (Number.isFinite(s.value) ? Math.max(0, s.value) : 0), 0);
  if (total <= 0) return <p className="py-6 text-center text-xs text-[var(--text-muted)]">{emptyText}</p>;

  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <div className="flex flex-wrap items-center gap-5">
      <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} />
        {slices.map((s) => {
          const frac = Math.max(0, s.value) / total;
          const dash = `${(frac * c).toFixed(2)} ${(c - frac * c).toFixed(2)}`;
          const offset = -acc * c;
          acc += frac;
          return (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={TONE_HEX[s.tone ?? 'gold']}
              strokeWidth={12}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        {centerValue ? (
          <div className="mb-2">
            <p className={LABEL}>{centerLabel}</p>
            <p className="text-lg font-bold tabular-nums text-[var(--text-primary)]">{centerValue}</p>
          </div>
        ) : null}
        {slices.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-[var(--text-secondary)]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: TONE_HEX[s.tone ?? 'gold'] }} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-[var(--text-muted)]">
              {((Math.max(0, s.value) / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
