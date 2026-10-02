import { ReactNode } from "react";

/** Consistent page header: eyebrow label + title + plain-words subtitle + optional action. */
export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-5 sm:mb-6 flex-wrap gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-gold-text font-bold">{eyebrow}</p>
        <h1 className="font-display text-2xl sm:text-3xl text-navy tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Consistent content card wrapper used for tables, forms, and grouped content. */
export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-line shadow-soft ${className}`}>{children}</div>;
}

/** Friendly "nothing here" box. */
export function EmptyState({ icon: Icon, title, text, action }: { icon: any; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-line-strong/40 p-10 text-center">
      <span className="mx-auto mb-3 w-12 h-12 rounded-full bg-cream flex items-center justify-center">
        <Icon className="w-6 h-6 text-doodle" />
      </span>
      <p className="font-display text-lg text-navy">{title}</p>
      {text && <p className="text-sm text-muted mt-1">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

const PILL_TONES: Record<string, string> = {
  success: "bg-success/10 text-success",
  warn: "bg-amber-500/10 text-warning",
  danger: "bg-error/10 text-error",
  neutral: "bg-navy/10 text-navy",
  gold: "bg-gold/10 text-gold-text",
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
