/**
 * Shared building blocks for the affiliate PORTAL.
 *
 * Every report page is assembled from these, so a change to spacing, empty-state
 * copy, sticky-header behaviour or number formatting lands everywhere at once
 * instead of being re-typed per page.
 *
 * Design language: "premium dark + gold" (tokens live in globals.css under
 * `.affiliate-surface`). Two rules run through every primitive here:
 *
 *   1. Depth is layered near-blacks, not boxes. Borders are hairlines of white
 *      at 8% - just enough to separate a card from the page behind it.
 *   2. Gold is spent, not sprinkled. Money, the active state and the single
 *      primary action get it. Labels, chrome and body copy never do.
 *
 * Money is MINOR units on the wire; `formatMoney` is the ONLY place it becomes
 * a display string, which is what keeps floating-point noise (the kind visible
 * on competitor dashboards, e.g. `50.900000000001455`) off our screens.
 */
'use client';

import { useEffect, useId as useReactId, useMemo, useRef, useState, type ReactNode } from 'react';

/* ────────────────────────────────────────────────────────────────────────────
 * Style tokens
 * ──────────────────────────────────────────────────────────────────────────── */

export const CARD =
  'rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]';

/** Card that responds to the pointer. Only for cards that actually do something. */
export const CARD_INTERACTIVE =
  `${CARD} transition-colors duration-200 hover:border-[var(--line-strong)] hover:bg-[var(--bg-raised)]`;

export const INPUT =
  'rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] hover:border-[var(--line-strong)] focus:border-[var(--gold-a55)] [color-scheme:dark]';

/**
 * The one gold button on a screen. A flat gold fill looks like a warning banner;
 * the vertical ramp plus a dark rim is what reads as metal.
 */
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--gold-deep)] bg-[linear-gradient(180deg,#F6E4AF_0%,#E7C873_40%,#C89F3F_100%)] px-4 py-2 text-sm font-bold text-[var(--gold-fg)] shadow-[var(--shadow-gold)] transition-[filter,transform] duration-150 hover:brightness-[1.06] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none';

export const BTN_GHOST =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--line-strong)] hover:bg-white/[0.07] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/[0.03]';

/** Small, quiet, icon-sized action. */
export const BTN_ICON =
  'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.03] text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:bg-white/[0.07] hover:text-[var(--text-primary)] disabled:opacity-40';

/** Every field/section label in the portal. 11px, uppercase, widely tracked. */
export const LABEL = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]';

/* ────────────────────────────────────────────────────────────────────────────
 * Formatting
 * ──────────────────────────────────────────────────────────────────────────── */

/** Minor units → a fixed-2 display string. Never leaks binary-float artefacts. */
export function formatMoney(minor: number | null | undefined, currency?: string): string {
  const n = Number.isFinite(minor as number) ? (minor as number) / 100 : 0;
  const s = n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${s} ${currency}` : s;
}

/**
 * Minor units → a short form (12.4K, 3.1M). For hero figures and axis labels
 * only: anywhere a partner might reconcile against their own numbers, show the
 * exact value.
 */
export function formatMoneyCompact(minor: number | null | undefined, currency?: string): string {
  const n = Number.isFinite(minor as number) ? (minor as number) / 100 : 0;
  const a = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const body =
    a >= 1_000_000_000 ? `${(a / 1_000_000_000).toFixed(a >= 10_000_000_000 ? 0 : 1)}B`
    : a >= 1_000_000 ? `${(a / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1)}M`
    : a >= 10_000 ? `${(a / 1_000).toFixed(a >= 100_000 ? 0 : 1)}K`
    : a.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${sign}${body} ${currency}` : `${sign}${body}`;
}

export function formatInt(n: number | null | undefined): string {
  return (Number.isFinite(n as number) ? (n as number) : 0).toLocaleString();
}

export function formatPct(n: number | null | undefined, digits = 1): string {
  if (!Number.isFinite(n as number)) return '—';
  return `${(n as number).toFixed(digits)}%`;
}

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return '—';
  // A bare `YYYY-MM-DD` is a calendar date, not an instant. `new Date()` would
  // read it as UTC midnight, which renders as the day before anywhere west of
  // Greenwich - so date-only strings are built from their own fields instead.
  if (typeof v === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString();
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

/**
 * Render a half-open [from, to) range the way a person reads it.
 *
 * The API sends an EXCLUSIVE upper bound — July is `1 Jul → 1 Aug` — so printing
 * `to` verbatim claims a day that is not in the total underneath it. One
 * millisecond comes off the end to land on the last instant actually counted.
 */
export function formatDateRange(from: string | Date | null | undefined, to: string | Date | null | undefined): string {
  const end = to ? new Date(to) : null;
  const endLabel = end && !Number.isNaN(end.getTime()) ? formatDate(new Date(end.getTime() - 1)) : '—';
  return `${formatDate(from)} → ${endLabel}`;
}

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

/** Short axis/tooltip form of a YYYY-MM-DD day key, parsed as LOCAL not UTC. */
export function formatDayShort(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  if (!y || !m || !d) return day;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** `Money` renders a signed amount and colours losses so a negative reads instantly. */
export function Money({
  minor,
  currency,
  signed,
  className,
}: {
  minor: number;
  currency?: string;
  signed?: boolean;
  className?: string;
}) {
  const neg = minor < 0;
  const tone = !signed ? '' : neg ? 'text-danger' : minor > 0 ? 'text-success' : '';
  return <span className={`tabular-nums ${tone} ${className ?? ''}`}>{formatMoney(minor, currency)}</span>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Motion
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Ease a number towards its new value. Purely presentational: the DOM lands on
 * the exact target, and users who asked for reduced motion get it immediately
 * rather than a shortened animation.
 */
export function useCountUp(target: number, duration = 850): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    const reduce =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || start === target || !Number.isFinite(target)) {
      from.current = target;
      setValue(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/** Animated money figure. `compact` for hero numbers, exact everywhere else. */
export function CountUpMoney({
  minor,
  currency,
  compact,
  className,
}: {
  minor: number;
  currency?: string;
  compact?: boolean;
  className?: string;
}) {
  const v = useCountUp(minor);
  const text = compact ? formatMoneyCompact(v, currency) : formatMoney(v, currency);
  return <span className={`tabular-nums ${className ?? ''}`}>{text}</span>;
}

export function CountUpInt({ value, className }: { value: number; className?: string }) {
  const v = useCountUp(value);
  return <span className={`tabular-nums ${className ?? ''}`}>{formatInt(Math.round(v))}</span>;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Atoms
 * ──────────────────────────────────────────────────────────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={`aff-skeleton rounded-lg ${className ?? ''}`} />;
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'gold' | 'success' | 'danger' | 'warning';
  className?: string;
}) {
  const map: Record<string, string> = {
    neutral: 'border-[var(--line)] bg-white/[0.04] text-[var(--text-secondary)]',
    gold: 'border-[var(--gold-a35)] bg-[var(--gold-glow)] text-[var(--gold)]',
    success: 'border-[var(--success-a35)] bg-[var(--success-a12)] text-success',
    danger: 'border-[var(--danger-a35)] bg-[var(--danger-a12)] text-danger',
    warning: 'border-[var(--warning-a35)] bg-[var(--warning-a12)] text-warning',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${map[tone]} ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

/** Thin progress rail. `tone` picks the fill; the track is always the same. */
export function ProgressBar({
  pct,
  tone = 'gold',
  className,
}: {
  pct: number;
  tone?: 'gold' | 'success' | 'neutral';
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const fill =
    tone === 'gold'
      ? 'bg-[linear-gradient(90deg,#C89F3F,#E7C873_60%,#F7E6B4)]'
      : tone === 'success'
        ? 'bg-success'
        : 'bg-white/25';
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06] ${className ?? ''}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-700 ease-out ${fill}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Section heading used inside cards - keeps the 11px tracked-label rhythm. */
export function SectionCard({
  title,
  hint,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  hint?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`${CARD} ${className ?? ''}`}>
      {title ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className={LABEL}>{title}</h2>
            {hint ? <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={bodyClassName ?? 'p-4 sm:p-5'}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <div
        className="mb-1 h-10 w-10 rounded-full border border-[var(--line)] bg-white/[0.03]"
        aria-hidden
      />
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      {hint ? <p className="max-w-sm text-xs leading-relaxed text-[var(--text-muted)]">{hint}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Metric card + delta
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Percentage change vs a comparison period. Returns null when there is no
 * meaningful baseline — showing "+100%" against a zero baseline is noise, not
 * information, so we render nothing instead.
 */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function DeltaChip({ value, suffix }: { value: number | null; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
        up ? 'bg-[var(--success-a12)] text-success' : 'bg-[var(--danger-a12)] text-danger'
      }`}
    >
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {Math.abs(value).toFixed(Math.abs(value) >= 10 ? 0 : 1)}%{suffix ? <span className="font-medium opacity-70">{suffix}</span> : null}
    </span>
  );
}

/**
 * The KPI tile. `accent="gold"` is reserved for money tiles - a grid where
 * every tile is gold has no hierarchy at all.
 */
export function MetricCard({
  label,
  value,
  sub,
  deltaPct,
  deltaSuffix,
  accent,
  icon,
  spark,
  loading,
  onClick,
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  deltaPct?: number | null;
  deltaSuffix?: string;
  accent?: 'gold' | 'success' | 'danger' | 'none';
  icon?: ReactNode;
  /** Trailing series for the tile's own sparkline. Omit to hide it. */
  spark?: number[];
  loading?: boolean;
  onClick?: () => void;
}) {
  const gold = accent === 'gold';
  const shell = `group relative overflow-hidden rounded-2xl border bg-[var(--bg-elevated)] p-4 text-left shadow-[var(--shadow-card)] transition-colors duration-200 ${
    gold ? 'border-[var(--gold-a22)] hover:border-[var(--gold-a55)]' : 'border-[var(--line)] hover:border-[var(--line-strong)]'
  } ${onClick ? 'cursor-pointer' : ''}`;

  const body = (
    <>
      {/* A whisper of gold in the top-left of money tiles, nothing on the rest. */}
      {gold ? (
        <span
          className="pointer-events-none absolute -left-8 -top-10 h-24 w-32 rounded-full bg-[var(--gold-a12)] blur-2xl"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <p className={LABEL}>{label}</p>
        {icon ? <span className="text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-secondary)]">{icon}</span> : null}
      </div>

      {loading ? (
        <Skeleton className="relative mt-3 h-7 w-28" />
      ) : (
        <p
          className={`relative mt-2 text-[22px] font-bold leading-tight tabular-nums ${
            gold ? 'aff-gold-text' : accent === 'success' ? 'text-success' : accent === 'danger' ? 'text-danger' : 'text-[var(--text-primary)]'
          }`}
        >
          {value}
        </p>
      )}

      <div className="relative mt-1.5 flex items-center gap-2">
        {sub ? <span className="text-[11px] text-[var(--text-muted)]">{sub}</span> : null}
        <DeltaChip value={deltaPct ?? null} suffix={deltaSuffix} />
      </div>

      {spark && spark.length > 1 ? (
        <div className="relative -mx-1 mt-3">
          <Sparkline points={spark} tone={gold ? 'gold' : 'neutral'} />
        </div>
      ) : null}
    </>
  );

  return onClick ? (
    <button type="button" onClick={onClick} className={shell}>
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/**
 * Inline sparkline - no chart library, no bundle cost.
 *
 * Draws a gradient area under the line and marks the final point, so the tile
 * answers "where did it end up" as well as "which way did it go".
 */
export function Sparkline({
  points,
  tone = 'gold',
  className,
  height = 34,
}: {
  points: number[];
  tone?: 'gold' | 'success' | 'danger' | 'neutral';
  className?: string;
  height?: number;
}) {
  // React's useId is SSR-safe; the colons it emits are stripped because two
  // sparklines on one page must not share a gradient id (the second would
  // silently repaint the first) and `url(#:r0:)` is needlessly fragile.
  const gradId = `spark${useReactId().replace(/:/g, '')}`;
  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const max = Math.max(...points, 0);
    const min = Math.min(...points, 0);
    const span = max - min || 1;
    const step = 100 / (points.length - 1);
    const xy = points.map((p, i) => [i * step, 30 - ((p - min) / span) * 26] as const);
    const line = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
    const area = `${line} L100,32 L0,32 Z`;
    return { line, area, last: xy[xy.length - 1] };
  }, [points]);

  if (!geom) return null;
  const stroke =
    tone === 'gold' ? 'var(--gold)' : tone === 'success' ? 'var(--success)' : tone === 'danger' ? 'var(--danger)' : 'rgba(255,255,255,0.45)';

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className={`w-full ${className ?? ''}`}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={geom.area} fill={`url(#${gradId})`} stroke="none" />
      <path d={geom.line} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {/* preserveAspectRatio="none" would squash a circle, so the end marker is
          a tiny rect sized in the stretched space. */}
      <rect x={geom.last[0] - 1.2} y={geom.last[1] - 1.2} width="2.4" height="2.4" rx="1.2" fill={stroke} />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Data table
 * ──────────────────────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  label: string;
  /** Right-align numeric columns so digits line up down the page. */
  numeric?: boolean;
  render: (row: T) => ReactNode;
  /** Optional footer cell for the totals row. */
  footer?: ReactNode;
  /**
   * Provide this to make the column sortable. Returns the value to compare;
   * strings sort with `localeCompare`, numbers numerically.
   */
  sortValue?: (row: T) => number | string;
  /** Extra classes for this column's cells (width hints, muting, etc). */
  cellClassName?: string;
}

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

/**
 * One table for every report: a header that pins below the topbar as you scroll,
 * horizontal scroll on narrow screens,
 * a real skeleton while loading (not a bare "Loading…"), an honest empty state,
 * click-to-sort columns and an optional totals footer.
 *
 * The row count shown by the caller always comes from the same `total` the pager
 * uses, so the footer can never disagree with the body the way competitor
 * dashboards do ("Showing 0 to 0 of 0 entries" above twelve visible rows).
 *
 * Sorting is done on the rows this component was handed. When the report is
 * paged server-side that is one page, not the whole result set, so `paged`
 * makes the table say so out loud instead of implying it re-ranked everything.
 */
export function DataTable<T>({
  columns,
  rows,
  loading,
  empty,
  emptyHint,
  failed,
  rowKey,
  showFooter,
  paged,
  minWidth = 720,
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  empty?: string;
  emptyHint?: string;
  /**
   * The query behind `rows` came back bad. Without this the table cannot tell
   * "the server says there is nothing" from "we never heard back", and it
   * defaults to the first — printing "No player activity in this range" over a
   * request that 404'd. The page-level `ErrorNote` explains what went wrong;
   * this stops the table contradicting it three lines further down.
   */
  failed?: boolean;
  rowKey: (row: T, i: number) => string;
  showFooter?: boolean;
  /** True when `rows` is one server-side page of a larger result set. */
  paged?: boolean;
  minWidth?: number;
}) {
  const [sort, setSort] = useState<SortState>(null);

  // See the wrapper below: `fits` decides between a pinned header and reachable
  // right-hand columns. Starts false so the first paint can never spill a wide
  // table out of its card; the observer corrects it before anyone notices.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const measure = () => setFits(el.scrollWidth <= el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // `loading` is a dependency because the skeleton branch below unmounts this
    // element entirely - without it the observer would be left watching a
    // detached node once the real table came back.
  }, [minWidth, columns.length, rows.length, loading]);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const get = col.sortValue;
    const sign = sort.dir === 'asc' ? 1 : -1;
    // Copy first: mutating the array from the query cache makes React Query hand
    // the next consumer a re-ordered "server" response.
    return [...rows].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * sign;
    });
  }, [rows, columns, sort]);

  if (loading) {
    return (
      <div className="space-y-2 py-2" aria-busy>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return failed ? (
      <EmptyState
        title="Report unavailable"
        hint="This report could not be loaded, so it is not showing you an empty result — see the message above for what went wrong."
      />
    ) : (
      <EmptyState
        title={empty ?? 'Nothing to show yet.'}
        hint={emptyHint ?? 'Try widening the date range or clearing the filters.'}
      />
    );
  }

  const toggle = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null));

  return (
    <div>
      {/*
        Horizontal overflow is switched on only when the table actually needs
        it, because the two features fight each other: any `overflow-x` other
        than `visible` makes this box a scroll container, and a scroll
        container becomes the sticky header's scrollport. This box never
        scrolls vertically, so the header would resolve against a scrollport
        that never moves - i.e. not stick at all, and slide up behind the
        topbar instead. (`overflow-y: clip` does not rescue it; paired with
        `overflow-x: auto` the used value is `hidden`, which still scrolls.)

        So: when the table fits, overflow stays `visible` and the header pins
        to the viewport. When it does not - the 16-column performance report,
        or any table on a narrow screen - being able to reach the right-hand
        columns matters more than a pinned header, and `auto` wins.
      */}
      <div ref={wrapRef} className="-mx-1 px-1" style={{ overflowX: fits ? 'visible' : 'auto' }}>
        <table className="w-full border-separate border-spacing-0 text-sm" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                const sortable = Boolean(c.sortValue);
                return (
                  <th
                    key={c.key}
                    aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`sticky z-10 whitespace-nowrap border-b border-[var(--line)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      active ? 'text-[var(--gold)]' : 'text-[var(--text-muted)]'
                    } ${c.numeric ? 'text-right' : 'text-left'}`}
                    /*
                      The offset has to follow `fits` for the same reason the
                      overflow does. When the table fits, the wrapper is
                      `overflow: visible`, the scrollport is the viewport, and the
                      header parks itself just under the topbar. When it does not,
                      the wrapper IS the scrollport - and because it only ever
                      scrolls sideways its scrollTop is pinned at 0, so a 67px
                      offset would shove the header 67px DOWN from its own static
                      position and straight over the first two rows. Zero there
                      leaves sticky resolving to the static position: a no-op.
                    */
                    style={{ top: fits ? 'var(--aff-topbar-h)' : 0 }}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggle(c.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-[0.12em] transition-colors hover:text-[var(--text-primary)] ${
                          c.numeric ? 'flex-row-reverse' : ''
                        }`}
                      >
                        {c.label}
                        <span className={`text-[9px] leading-none ${active ? 'opacity-100' : 'opacity-30'}`} aria-hidden>
                          {active ? (sort?.dir === 'asc' ? '▲' : '▼') : '▼'}
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={rowKey(r, i)} className="group transition-colors hover:bg-[var(--gold-a06)]">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap border-b border-white/[0.045] px-3 py-2.5 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--text-primary)] ${
                      c.numeric ? 'text-right tabular-nums' : 'text-left'
                    } ${c.cellClassName ?? ''}`}
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {showFooter && columns.some((c) => c.footer !== undefined) ? (
            <tfoot>
              <tr>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap border-t border-[var(--line-strong)] bg-white/[0.02] px-3 py-2.5 text-sm font-bold text-[var(--text-primary)] ${
                      c.numeric ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {c.footer ?? ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
      {sort && paged ? (
        <p className="mt-2 text-[11px] text-[var(--text-muted)]">Sorted within the rows on this page.</p>
      ) : null}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pager
 * ──────────────────────────────────────────────────────────────────────────── */

export function Pager({
  page,
  pages,
  total,
  limit,
  onPage,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(total, page * limit);
  const btn = 'h-9 min-w-9 px-2.5 text-xs';
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
      {/* Honest counts: derived from the same `total` the server paged on. */}
      <span>
        Showing <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatInt(first)}</span>–
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatInt(last)}</span> of{' '}
        <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatInt(total)}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPage(1)} disabled={page <= 1} className={`${BTN_GHOST} ${btn}`} aria-label="First page">
          «
        </button>
        <button onClick={() => onPage(page - 1)} disabled={page <= 1} className={`${BTN_GHOST} ${btn}`}>
          Prev
        </button>
        <span className="px-2 font-semibold tabular-nums text-[var(--text-primary)]">
          {page} / {pages}
        </span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages} className={`${BTN_GHOST} ${btn}`}>
          Next
        </button>
        <button onClick={() => onPage(pages)} disabled={page >= pages} className={`${BTN_GHOST} ${btn}`} aria-label="Last page">
          »
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Date range filter
 * ──────────────────────────────────────────────────────────────────────────── */

export interface DateRange {
  from: string;
  to: string;
}

export function isoDay(d: Date): string {
  // Local-date ISO (not toISOString, which shifts to UTC and can select the
  // wrong day for users east/west of Greenwich).
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DATE_PRESETS: { key: string; label: string; range: () => DateRange }[] = [
  { key: 'today', label: 'Today', range: () => { const d = new Date(); return { from: isoDay(d), to: isoDay(d) }; } },
  { key: 'yesterday', label: 'Yesterday', range: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: isoDay(d), to: isoDay(d) }; } },
  { key: '7d', label: 'Last 7 days', range: () => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: isoDay(f), to: isoDay(t) }; } },
  { key: '30d', label: 'Last 30 days', range: () => { const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 29); return { from: isoDay(f), to: isoDay(t) }; } },
  { key: 'month', label: 'This month', range: () => { const t = new Date(); return { from: isoDay(new Date(t.getFullYear(), t.getMonth(), 1)), to: isoDay(t) }; } },
  { key: 'lastMonth', label: 'Last month', range: () => { const t = new Date(); return { from: isoDay(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: isoDay(new Date(t.getFullYear(), t.getMonth(), 0)) }; } },
];

/** Look a preset range up by key - pages should never index DATE_PRESETS positionally. */
export function presetRange(key: string): DateRange {
  return DATE_PRESETS.find((p) => p.key === key)?.range() ?? { from: '', to: '' };
}

/** Segmented-control chip. Gold when active, because the active state is a fact. */
export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150 ${
        active
          ? 'border-[var(--gold-a55)] bg-[var(--gold-glow)] text-[var(--gold)]'
          : 'border-[var(--line)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]'
      } ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (r: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const allTime = !value.from && !value.to;
  const active = allTime
    ? undefined
    : DATE_PRESETS.find((p) => { const r = p.range(); return r.from === value.from && r.to === value.to; });
  const custom = open || (!active && !allTime);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip active={allTime && !open} onClick={() => { onChange({ from: '', to: '' }); setOpen(false); }}>
          All time
        </Chip>
        {DATE_PRESETS.map((p) => (
          <Chip key={p.key} active={active?.key === p.key && !open} onClick={() => { onChange(p.range()); setOpen(false); }}>
            {p.label}
          </Chip>
        ))}
        <Chip active={custom} onClick={() => setOpen((o) => !o)}>
          Custom
        </Chip>
      </div>
      {custom && (
        <div className="flex items-center gap-2">
          <input type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} className={INPUT} aria-label="From date" />
          <span className="text-xs text-[var(--text-muted)]">to</span>
          <input type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className={INPUT} aria-label="To date" />
        </div>
      )}
    </div>
  );
}

/**
 * The filters currently narrowing a report, each removable.
 *
 * A filter that is applied but invisible is the most common way a dashboard
 * lies to its user, so anything narrowing the result set gets a chip.
 */
export function FilterChips({ items }: { items: { key: string; label: string; value: string; onClear: () => void }[] }) {
  const live = items.filter((i) => i.value);
  if (!live.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className={LABEL}>Filtered by</span>
      {live.map((i) => (
        <span
          key={i.key}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white/[0.04] py-1 pl-2.5 pr-1 text-xs text-[var(--text-secondary)]"
        >
          <span className="text-[var(--text-muted)]">{i.label}</span>
          <span className="font-semibold text-[var(--text-primary)]">{i.value}</span>
          <button
            type="button"
            onClick={i.onClear}
            aria-label={`Clear ${i.label} filter`}
            className="ml-0.5 flex h-4 w-4 items-center justify-center rounded text-[var(--text-muted)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Export button
 * ──────────────────────────────────────────────────────────────────────────── */

export function ExportButton({ onExport, disabled }: { onExport: () => Promise<void>; disabled?: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'error'>('idle');
  return (
    <button
      onClick={async () => {
        setState('busy');
        try { await onExport(); setState('idle'); } catch { setState('error'); }
      }}
      disabled={disabled || state === 'busy'}
      className={BTN_GHOST}
      title="Download this report as CSV"
    >
      {state === 'busy' ? 'Preparing…' : state === 'error' ? 'Export failed — retry' : '↓ Export CSV'}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Report shell
 * ──────────────────────────────────────────────────────────────────────────── */

/** Page frame every report shares: title, description, filter bar, body card. */
export function ReportShell({
  title,
  description,
  filters,
  actions,
  children,
}: {
  title: string;
  description?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="aff-rise space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {filters ? <div className={`${CARD} p-4`}>{filters}</div> : null}
      <div className={`${CARD} p-4 sm:p-5`}>{children}</div>
    </div>
  );
}

/**
 * Inline status strip for a report query.
 *
 * Two distinct states, deliberately styled differently:
 *  - `error`   the request came back bad. Red, because someone must act.
 *  - `paused`  the request never ran or is waiting between retries (TanStack
 *              parks work while the tab is hidden or the browser thinks it is
 *              offline). Neutral, because it resolves itself - but it must be
 *              said out loud, since a parked query has no data and no error and
 *              would otherwise let a table render its empty state and imply
 *              "there is nothing here" when the truth is "we never asked".
 */
export function ErrorNote({ error, paused }: { error: unknown; paused?: boolean }) {
  if (error) {
    const msg = error instanceof Error ? error.message : 'Something went wrong loading this report.';
    return (
      <div className="mb-3 flex items-start gap-2 rounded-xl border border-[var(--danger-a35)] bg-[var(--danger-a12)] px-3 py-2.5 text-sm text-[var(--danger)]">
        <span aria-hidden className="mt-px">⚠</span>
        <span>{msg}</span>
      </div>
    );
  }
  if (paused) {
    return (
      <div className="mb-3 rounded-xl border border-[var(--line)] bg-white/[0.03] px-3 py-2.5 text-sm text-[var(--text-muted)]">
        Waiting for the connection to come back — this will load automatically.
      </div>
    );
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Segmented control
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * A small set of mutually exclusive views, rendered as pills inside a sunken
 * track. Used for report scopes (player / downline) and history tabs.
 *
 * This is a `radiogroup`, not a row of buttons: arrow keys move between the
 * options and only the selected one is a tab stop, which is what a keyboard
 * user expects from something that looks like this.
 */
export function SegmentedControl<K extends string>({
  value,
  options,
  onChange,
  className,
  label,
}: {
  value: K;
  options: { key: K; label: string; hint?: string }[];
  onChange: (key: K) => void;
  className?: string;
  label?: string;
}) {
  const move = (dir: 1 | -1) => {
    const i = options.findIndex((o) => o.key === value);
    if (i < 0) return;
    onChange(options[(i + dir + options.length) % options.length].key);
  };
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg-sunken)] p-1 ${className ?? ''}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      }}
    >
      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            title={o.hint}
            onClick={() => onChange(o.key)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 ${
              active
                ? 'border-[var(--gold-a55)] bg-[var(--gold-glow)] text-[var(--gold)]'
                : 'border-transparent text-[var(--text-secondary)] hover:bg-white/[0.05] hover:text-[var(--text-primary)]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Search field
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Submit-only text filter.
 *
 * Deliberately not live-filtering: every keystroke would be a round trip to a
 * paged report endpoint, and a half-typed username matches nothing, so the user
 * would watch the table empty itself while they type. The draft is local; the
 * applied value only changes on submit or clear.
 *
 * `value` is still watched, because the same filter can be cleared from a
 * FilterChip elsewhere on the page - when that happens the box must empty too.
 */
export function SearchField({
  value,
  onApply,
  label,
  placeholder,
  width = 'w-56',
}: {
  value: string;
  onApply: (v: string) => void;
  label: string;
  placeholder?: string;
  width?: string;
}) {
  const [draft, setDraft] = useState(value);
  const id = useReactId();
  useEffect(() => { setDraft(value); }, [value]);
  const dirty = draft.trim() !== value;
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => { e.preventDefault(); onApply(draft.trim()); }}
    >
      <div>
        <label htmlFor={id} className={`${LABEL} mb-1.5 block`}>{label}</label>
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className={`${INPUT} ${width}`}
        />
      </div>
      <button type="submit" disabled={!dirty} className={`${BTN_GHOST} disabled:cursor-default disabled:opacity-40`}>
        Search
      </button>
      {value ? (
        <button type="button" onClick={() => { setDraft(''); onApply(''); }} className={BTN_GHOST}>
          Clear
        </button>
      ) : null}
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Summary strip
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The totals band that sits above a report table.
 *
 * Wraps rather than gridding, because the reports it serves carry anywhere from
 * two stats to six - a fixed column count would either strand whitespace on the
 * small ones or crush the wide ones.
 */
export function SummaryStrip({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start gap-x-8 gap-y-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] px-4 py-3">
      {children}
    </div>
  );
}

/** One figure inside a SummaryStrip. Gold means money the partner has earned. */
export function SummaryStat({
  label,
  value,
  tone = 'plain',
}: {
  label: string;
  value: ReactNode;
  tone?: 'plain' | 'gold' | 'success' | 'danger';
}) {
  const colour =
    tone === 'gold' ? 'text-[var(--gold)]'
    : tone === 'success' ? 'text-[var(--success)]'
    : tone === 'danger' ? 'text-[var(--danger)]'
    : 'text-[var(--text-primary)]';
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${colour}`}>{value}</p>
    </div>
  );
}
