interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  action?: React.ReactNode;
}

export function getPaginationRange(page: number, total: number, limit: number) {
  return {
    start: total > 0 ? (page - 1) * limit + 1 : 0,
    end: Math.min(page * limit, total),
  };
}

export function Pagination({ page, totalPages, total, limit, onPageChange, action }: Props) {
  const { start, end } = getPaginationRange(page, total, limit);

  return (
    <div className="flex items-center justify-between rounded-lg px-4 py-2 bg-white border border-gray-200">
      <span className="text-sm" style={{ color: 'var(--ink-3)' }}>
        {total > 0 ? `${start}–${end} of ${total}` : '0 results'}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', background: 'white' }}
        >
          ← Prev
        </button>
        <span className="text-sm font-medium px-1" style={{ color: 'var(--ink-2)' }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--line)', color: 'var(--ink-2)', background: 'white' }}
        >
          Next →
        </button>
        {action}
      </div>
    </div>
  );
}
