import type { AffiliateListPagination } from '@/lib/affiliatePagination';

type Props = {
  pagination: AffiliateListPagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

/**
 * Compact Turkish pagination: Önceki | 1 | 2 | 3 | Sonraki
 * Hidden when totalPages <= 1.
 */
export function CompactTablePagination({ pagination, onPageChange, disabled }: Props) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const maxButtons = 5;
  let start = Math.max(1, page - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  start = Math.max(1, end - maxButtons + 1);
  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) pages.push(p);

  const btnBase =
    'inline-flex min-h-7 min-w-7 shrink-0 items-center justify-center rounded px-1.5 text-[11px] font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-40';
  const navBtn = `${btnBase} border border-[#e4ebf0] bg-white text-[#5c6b7a] hover:bg-[#f7faf9] hover:text-[#1e2a3a]`;
  const pageBtn = (active: boolean) =>
    active
      ? `${btnBase} bg-[#0f5c56] text-white/95`
      : `${btnBase} border border-[#e4ebf0] bg-white text-[#5c6b7a] hover:bg-[#f7faf9] hover:text-[#1e2a3a]`;

  return (
    <nav
      className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:justify-end"
      aria-label="Sayfalama"
    >
      <button
        type="button"
        className={navBtn}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Önceki
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={pageBtn(p === page)}
          disabled={disabled}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        className={navBtn}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Sonraki
      </button>
    </nav>
  );
}
