export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="font-display text-3xl mt-1 text-forest">{value}</p>
      {hint && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
    </div>
  );
}
