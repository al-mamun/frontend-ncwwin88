/**
 * Network — the affiliate's place in the referral hierarchy.
 *
 * Two directions, deliberately drawn differently:
 *
 *  - UPLINE is a chain. It has exactly one shape, it never branches, and the
 *    partner cannot act on it — so it renders as a compact breadcrumb rather
 *    than a second tree competing for attention.
 *  - DOWNLINE is a tree, and it is the part the partner grows. It gets the room:
 *    an indented, collapsible outline with each sub-affiliate's players,
 *    depositors and lifetime commission on the row.
 *
 * The depth control is a real server parameter, not a client-side filter. Asking
 * for five levels on a wide network is a genuinely expensive query, so the
 * default stays at three and going deeper is an explicit choice.
 *
 * `retry: false`, and an absent hierarchy renders an explanation rather than an
 * error: sub-affiliate recruitment is an optional programme, and a partner who
 * has never been offered it should not be shown a broken page.
 */
'use client';

import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  affiliateReportsApi,
  type HierarchyNode,
  type HierarchyTreeNode,
} from '@/services/affiliate-reports.service';
import {
  Badge,
  EmptyState,
  ErrorNote,
  LABEL,
  SectionCard,
  SegmentedControl,
  Skeleton,
  SummaryStat,
  SummaryStrip,
  formatInt,
  formatMoney,
  formatMoneyCompact,
} from '@/components/affiliate/portal-ui';
import { usePortalFeatures } from '@/providers/affiliate-auth-provider';

/* ── local bits ──────────────────────────────────────────────────────────── */

const DEPTHS = [
  { key: '1' as const, label: '1 level', hint: 'Direct sub-affiliates only.' },
  { key: '2' as const, label: '2', hint: 'Two levels deep.' },
  { key: '3' as const, label: '3', hint: 'Three levels deep — the default.' },
  { key: '5' as const, label: '5', hint: 'The deepest the server will walk.' },
];

/** Roll a subtree up into one set of figures. Counts every descendant, not just direct children. */
function rollUp(nodes: HierarchyTreeNode[]): {
  partners: number;
  signups: number;
  ftdCount: number;
  commissionMinor: number;
} {
  return nodes.reduce(
    (acc, n) => {
      const kids = rollUp(n.children ?? []);
      return {
        partners: acc.partners + 1 + kids.partners,
        signups: acc.signups + (n.signups || 0) + kids.signups,
        ftdCount: acc.ftdCount + (n.ftdCount || 0) + kids.ftdCount,
        commissionMinor: acc.commissionMinor + (n.lifetimeCommissionMinor || 0) + kids.commissionMinor,
      };
    },
    { partners: 0, signups: 0, ftdCount: 0, commissionMinor: 0 },
  );
}

/** Every id in the tree, so "expand all" does not have to be a second traversal at call time. */
function allIds(nodes: HierarchyTreeNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    out.push(n.id);
    allIds(n.children ?? [], out);
  }
  return out;
}

const STATUS_TONE: Record<string, 'success' | 'gold' | 'danger' | 'neutral'> = {
  active: 'success',
  approved: 'success',
  pending: 'gold',
  suspended: 'danger',
  rejected: 'danger',
};

/** Status pill for a node. Unknown statuses render neutral rather than being dropped. */
function StatusDot({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? 'neutral';
  const colour =
    tone === 'success'
      ? 'bg-[var(--success)]'
      : tone === 'gold'
        ? 'bg-[var(--gold)]'
        : tone === 'danger'
          ? 'bg-[var(--danger)]'
          : 'bg-white/30';
  return (
    <span
      title={status}
      aria-label={`Status: ${status}`}
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${colour}`}
    />
  );
}

/**
 * Three figures shown on every node row, in the same order everywhere.
 *
 * No currency suffix: the whole portal is single-currency per affiliate, and
 * repeating the code on every row of a tree is noise, not information.
 */
function NodeFigures({ node }: { node: HierarchyNode }) {
  return (
    <div className="flex shrink-0 items-center gap-4 sm:gap-6">
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatInt(node.signups)}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">players</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatInt(node.ftdCount)}</p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">depositors</p>
      </div>
      <div className="w-24 text-right sm:w-28">
        <p className="text-sm font-semibold tabular-nums text-[var(--gold)]">
          {formatMoneyCompact(node.lifetimeCommissionMinor)}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">earned</p>
      </div>
    </div>
  );
}

/**
 * One branch of the downline, drawn recursively.
 *
 * Indentation is padding on a bordered container rather than a margin per level,
 * so the vertical rule that connects a parent to its children is continuous
 * instead of restarting at every row. Depth is capped by the server, so the
 * recursion is bounded by the data.
 */
function TreeBranch({
  nodes,
  collapsed,
  toggle,
  depth,
}: {
  nodes: HierarchyTreeNode[];
  collapsed: Set<string>;
  toggle: (id: string) => void;
  depth: number;
}) {
  return (
    <ul className={depth > 0 ? 'ml-3 border-l border-[var(--line)] pl-3 sm:ml-4 sm:pl-4' : ''}>
      {nodes.map((n) => {
        const kids = n.children ?? [];
        const isCollapsed = collapsed.has(n.id);
        return (
          <li key={n.id} className="mt-1.5 first:mt-0">
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-[var(--line-strong)] hover:bg-white/[0.04]">
              {kids.length ? (
                <button
                  type="button"
                  onClick={() => toggle(n.id)}
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${n.displayName || n.code}`}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[var(--line)] text-[10px] text-[var(--text-secondary)] transition-colors hover:border-[var(--gold-a55)] hover:text-[var(--gold)]"
                >
                  {isCollapsed ? '+' : '−'}
                </button>
              ) : (
                // A leaf keeps the same 20px gutter so every row's name starts on
                // the same x — the indentation should encode depth, nothing else.
                <span className="h-5 w-5 shrink-0" aria-hidden />
              )}

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <StatusDot status={n.status} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {n.displayName || n.code}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--text-muted)]">
                    {n.code}
                    {kids.length ? ` · ${formatInt(kids.length)} direct` : ''}
                    {/*
                      A node at the depth cut-off comes back with no children
                      even when it has some. Without this it is indistinguishable
                      from a genuine leaf, and the tree quietly understates the
                      network.
                    */}
                    {n.truncated ? (
                      <span className="text-[var(--text-secondary)]"> · more below</span>
                    ) : null}
                  </p>
                </div>
              </div>

              <NodeFigures node={n} />
            </div>

            {kids.length && !isCollapsed ? (
              <TreeBranch nodes={kids} collapsed={collapsed} toggle={toggle} depth={depth + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function NetworkPage() {
  const [depth, setDepth] = useState<'1' | '2' | '3' | '5'>('3');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // The nav entry is already hidden when the tenant runs a single-tier program,
  // but the URL is still typeable and old bookmarks still exist. Gating the page
  // itself is what makes the switch mean something rather than just tidy the menu.
  const { subAffiliates } = usePortalFeatures();

  const q = useQuery({
    queryKey: ['affiliate', 'hierarchy', depth],
    queryFn: () => affiliateReportsApi.hierarchy(Number(depth)),
    // No point asking the server for a hierarchy the brand does not offer.
    enabled: subAffiliates,
    // Keep the old tree on screen while a deeper one loads: the rows that are
    // already correct do not need to flash away and come back identical.
    placeholderData: keepPreviousData,
    staleTime: 120_000,
    retry: false,
  });

  const data = q.data;
  const downline = useMemo(() => data?.downline ?? [], [data]);
  const totals = useMemo(() => rollUp(downline), [downline]);

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => setCollapsed(new Set(allIds(downline))), [downline]);
  const expandAll = useCallback(() => setCollapsed(new Set()), []);
  const anyCollapsed = collapsed.size > 0;
  const hasBranches = downline.some((n) => (n.children ?? []).length > 0);

  // An explanation, not a 404: the partner did not do anything wrong by arriving
  // here, and "this brand doesn't run a multi-tier program" is a complete answer.
  if (!subAffiliates) {
    return (
      <div className="aff-rise space-y-5">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Network</h1>
        </header>
        <SectionCard title="Not part of this program">
          <EmptyState
            title="Sub-affiliates are not enabled"
            hint="This partner program is single-tier: you earn from the players you refer, not from other partners. Nothing on your account is affected."
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="aff-rise space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Network</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            The partners below you, what each of them has brought in, and where you sit in the chain.
          </p>
        </div>
        <SegmentedControl label="Tree depth" value={depth} options={DEPTHS} onChange={setDepth} />
      </header>

      <ErrorNote error={q.error} paused={q.isPaused} />

      {/* ── Upline ───────────────────────────────────────────────────────── */}
      {data?.upline?.length ? (
        <SectionCard title="Your upline" hint="Who introduced you, top of the chain first">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
            {data.upline.map((u) => (
              <span key={u.id} className="flex items-center gap-1.5">
                <span className="rounded-lg border border-[var(--line)] bg-white/[0.02] px-2.5 py-1">
                  <span className="text-[var(--text-secondary)]">{u.displayName || u.code}</span>
                  <span className="ml-1.5 font-mono text-[11px] text-[var(--text-muted)]">{u.code}</span>
                </span>
                <span aria-hidden className="text-[var(--text-muted)]">
                  ›
                </span>
              </span>
            ))}
            <span className="rounded-lg border border-[var(--gold-a55)] bg-[var(--gold-a12)] px-2.5 py-1">
              <span className="font-semibold text-[var(--gold-bright)]">
                {data.self.displayName || data.self.code}
              </span>
              <span className="ml-1.5 font-mono text-[11px] text-[var(--gold)]">{data.self.code}</span>
            </span>
          </div>
        </SectionCard>
      ) : null}

      {/* ── Downline ─────────────────────────────────────────────────────── */}
      <SectionCard
        title="Your downline"
        hint={
          data
            ? `${formatInt(totals.partners)} sub-affiliate${totals.partners === 1 ? '' : 's'} within ${data.maxDepth} level${data.maxDepth === 1 ? '' : 's'}`
            : undefined
        }
        actions={
          hasBranches ? (
            <button
              type="button"
              onClick={anyCollapsed ? expandAll : collapseAll}
              className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              {anyCollapsed ? 'Expand all' : 'Collapse all'}
            </button>
          ) : null
        }
      >
        {q.isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : !data ? (
          <EmptyState
            title="Network view unavailable"
            hint="This portal could not load your hierarchy. Nothing else on your account is affected."
          />
        ) : !downline.length ? (
          <EmptyState
            title="No sub-affiliates yet"
            hint="Sub-affiliates are partners who sign up under your code. When your operator enables recruitment for your account, everyone you bring in appears here with their own players and earnings."
          />
        ) : (
          <>
            <SummaryStrip>
              <SummaryStat label="Sub-affiliates" value={formatInt(totals.partners)} />
              <SummaryStat label="Players in network" value={formatInt(totals.signups)} />
              <SummaryStat label="Depositors" value={formatInt(totals.ftdCount)} />
              <SummaryStat
                label="Earned by network"
                value={formatMoney(totals.commissionMinor)}
                tone="gold"
              />
            </SummaryStrip>

            {/* Your own row heads the tree so the totals above have an anchor: it is
                the one node whose figures are yours rather than a partner's. */}
            <div className="mb-2 flex items-center gap-2.5 rounded-xl border border-[var(--gold-a35)] bg-[var(--gold-a06)] px-3 py-2.5">
              <span className="h-5 w-5 shrink-0" aria-hidden />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <StatusDot status={data.self.status} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--gold-bright)]">
                    {data.self.displayName || data.self.code}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[var(--gold)]">
                    {data.self.code} · you · {formatInt(downline.length)} direct
                  </p>
                </div>
              </div>
              <NodeFigures node={data.self} />
            </div>

            <TreeBranch nodes={downline} collapsed={collapsed} toggle={toggle} depth={0} />

            {/*
              This used to say the hidden partners were "counted in their
              parent's totals". They are not — every node reports only its own
              figures, so anyone below the cut is missing from the tree AND from
              the two totals above it. Saying so is the difference between a
              partner trusting the number and being misled by it.
            */}
            {Number(depth) < 5 ? (
              <p className="mt-3 text-[11px] text-[var(--text-muted)]">
                Showing {data.maxDepth} level{data.maxDepth === 1 ? '' : 's'}. The totals above cover only the
                partners listed here — anyone deeper is not included. Raise the depth to count them.
              </p>
            ) : null}
          </>
        )}
      </SectionCard>

      {/* A partner reading this page is deciding whether recruiting is worth it, so
          the one thing they need to know sits at the bottom rather than nowhere. */}
      {data?.self ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] px-4 py-3">
          <div>
            <p className={LABEL}>Your affiliate code</p>
            <p className="mt-1 font-mono text-base font-semibold text-[var(--gold)]">{data.self.code}</p>
          </div>
          <Badge tone="neutral">Sub-affiliates sign up under this code</Badge>
        </div>
      ) : null}
    </div>
  );
}
