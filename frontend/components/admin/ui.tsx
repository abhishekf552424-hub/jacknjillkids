import { ReactNode } from "react";

/** Consistent page header: eyebrow label + title + optional right-aligned action. */
export function AdminPageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold font-bold">{eyebrow}</p>
        <h1 className="font-display text-3xl text-navy tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}

/** Consistent content card wrapper used for tables, forms, and grouped content. */
export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-lg shadow-soft ${className}`}>{children}</div>;
}

const PILL_TONES: Record<string, string> = {
  success: "bg-success/10 text-success",
  warn: "bg-amber-500/10 text-amber-600",
  danger: "bg-error/10 text-error",
  neutral: "bg-navy/10 text-navy",
  gold: "bg-gold/10 text-gold",
};

/** One consistent status/tag pill, used everywhere a status is shown (orders, products, coupons, etc). */
export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: keyof typeof PILL_TONES }) {
  return <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${PILL_TONES[tone] ?? PILL_TONES.neutral}`}>{label}</span>;
}

/** Standard table shell: consistent header row, alternating row hover, cell padding. */
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function AdminThead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-cream text-navy sticky top-0">
      <tr>{children}</tr>
    </thead>
  );
}
export function AdminTh({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide text-navy/70 text-${align}`}>{children}</th>;
}
export function AdminTr({ children }: { children: ReactNode }) {
  return <tr className="border-t border-navy/5 hover:bg-cream/50 transition-colors">{children}</tr>;
}

/** Bulk-action bar — appears above a table when 1+ rows are selected. */
export function BulkActionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-3 bg-navy text-white rounded-lg px-4 py-3 mb-3 text-sm">
      <span className="font-medium">{count} selected</span>
      <div className="flex items-center gap-2">{children}</div>
      <button onClick={onClear} className="ml-auto text-white/70 hover:text-white text-xs underline">
        Clear selection
      </button>
    </div>
  );
}
