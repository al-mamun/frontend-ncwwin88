/**
 * Shared premium gradient backdrop for the affiliate portal (auth, onboarding,
 * dashboard). Matches the landing hero: deep navy gradient + soft gold/red/cyan
 * glows. Pure presentational — render it as the first child of a relative page
 * wrapper, then place content in a sibling with `relative`.
 */
export function AffiliateBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a0e1a_0%,#0c1222_45%,#0a0e1a_100%)]" />
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,193,7,0.16),transparent_60%)] blur-2xl" />
      <div className="absolute -right-40 top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(230,57,70,0.14),transparent_60%)] blur-2xl" />
      <div className="absolute bottom-0 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,212,255,0.07),transparent_60%)] blur-2xl" />
    </div>
  );
}
