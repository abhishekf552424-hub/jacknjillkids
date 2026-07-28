import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  current,
  total,
  perPage,
  basePath,
  searchParams,
}: {
  current: number;
  total: number;
  perPage: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages < 2) return null;

  const buildUrl = (page: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") q.set(k, v);
    });
    q.set("page", String(page));
    return `${basePath}?${q.toString()}`;
  };

  // Compact window: first, current-1, current, current+1, last
  const windowSet = new Set<number>();
  windowSet.add(1);
  windowSet.add(pages);
  for (let i = Math.max(1, current - 1); i <= Math.min(pages, current + 1); i++) windowSet.add(i);
  const list = Array.from(windowSet).sort((a, b) => a - b);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-10"
      data-testid="pagination"
    >
      <Link
        href={buildUrl(Math.max(1, current - 1))}
        aria-disabled={current <= 1}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm border transition-colors ${
          current <= 1
            ? "pointer-events-none opacity-40 border-navy/10 text-muted"
            : "border-navy/10 text-navy hover:border-gold hover:text-gold"
        }`}
        data-testid="pagination-prev"
      >
        <ChevronLeft className="w-4 h-4" /> Prev
      </Link>
      {list.map((p, idx) => {
        const gap = idx > 0 && p - list[idx - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="text-muted px-1">…</span>}
            <Link
              href={buildUrl(p)}
              aria-current={p === current ? "page" : undefined}
              className={`min-w-9 h-9 inline-flex items-center justify-center rounded-md text-sm font-bold border transition-colors ${
                p === current
                  ? "bg-navy text-white border-navy"
                  : "border-navy/10 text-navy hover:border-gold hover:text-gold"
              }`}
              data-testid={`pagination-page-${p}`}
            >
              {p}
            </Link>
          </span>
        );
      })}
      <Link
        href={buildUrl(Math.min(pages, current + 1))}
        aria-disabled={current >= pages}
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm border transition-colors ${
          current >= pages
            ? "pointer-events-none opacity-40 border-navy/10 text-muted"
            : "border-navy/10 text-navy hover:border-gold hover:text-gold"
        }`}
        data-testid="pagination-next"
      >
        Next <ChevronRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}
