import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable pagination bar for DRF-paginated list views.
 * Receives `hasNext` / `hasPrev` booleans derived from the API's `next` / `previous` fields.
 *
 * Usage:
 *   <Pagination
 *     count={totalCount}
 *     page={page}
 *     hasNext={!!apiNext}
 *     hasPrev={!!apiPrev}
 *     loading={loading}
 *     onNext={() => setPage(p => p + 1)}
 *     onPrev={() => setPage(p => p - 1)}
 *   />
 */
export default function Pagination({ count, page, hasNext, hasPrev, loading, onNext, onPrev }) {
  if (!count) return null;

  const btnBase = {
    background: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: 8,
    padding: '6px 14px',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    transition: 'var(--transition)',
    fontFamily: 'Outfit, sans-serif',
    fontWeight: 500,
  };

  const btnEnabled = { ...btnBase, color: 'var(--text-primary)', cursor: 'pointer' };
  const btnDisabled = { ...btnBase, color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.5 };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 24px',
      borderTop: '1px solid var(--border-light)',
      fontSize: 13,
      color: 'var(--text-secondary)',
    }}>
      <span>
        <strong style={{ color: 'var(--text-primary)' }}>{count.toLocaleString()}</strong>
        {' '}resultado{count !== 1 ? 's' : ''} en total
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onPrev}
          disabled={!hasPrev || loading}
          style={hasPrev && !loading ? btnEnabled : btnDisabled}
        >
          <ChevronLeft size={15} /> Anterior
        </button>

        <span style={{
          padding: '5px 14px',
          background: 'var(--accent-primary-glow)',
          borderRadius: 8,
          fontWeight: 700,
          color: 'var(--accent-primary)',
          fontSize: 13,
        }}>
          {page}
        </span>

        <button
          onClick={onNext}
          disabled={!hasNext || loading}
          style={hasNext && !loading ? btnEnabled : btnDisabled}
        >
          Siguiente <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
