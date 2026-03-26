import React, { useState, useEffect, useRef } from 'react';

type SearchMode = 'phone' | 'magic' | 'name' | 'event';

interface SearchBarProps {
  onSearch: (query: string, mode: SearchMode) => void;
  loading: boolean;
  resultCount: number;
}

const modes: { key: SearchMode; icon: string; label: string; placeholder: string }[] = [
  { key: 'phone',  icon: '📱', label: 'Phone',      placeholder: 'Enter phone number (e.g. 79133...)' },
  { key: 'magic',  icon: '🆔', label: 'Magic ID',   placeholder: 'Enter first 4+ digits of URN (e.g. 03db)' },
  { key: 'name',   icon: '👤', label: 'Name / Email', placeholder: 'Search by name or email address...' },
  { key: 'event',  icon: '🎫', label: 'Event URN',  placeholder: 'Paste full Event URN (e.g. 9e864db8-d2e9-...)' },
];

export default function SearchBar({ onSearch, loading, resultCount }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('phone');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const activeMode = modes.find((m) => m.key === mode)!;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (mode === 'event') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(query.trim())) {
        timerRef.current = setTimeout(() => onSearch(query.trim(), mode), 300);
      }
    } else if (query.trim().length >= 2) {
      timerRef.current = setTimeout(() => onSearch(query.trim(), mode), 300);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query, mode]);

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setQuery('');
  };

  const statusText = loading
    ? 'Searching...'
    : mode === 'event'
      ? (query.length >= 36 ? `${resultCount} result${resultCount !== 1 ? 's' : ''} found` : 'Paste a full Event URN (UUID) to search')
      : query.length >= 2
        ? `${resultCount} result${resultCount !== 1 ? 's' : ''} found`
        : 'Type at least 2 characters to search';

  return (
    <div>
      {/* ── Mode selector: flat row of pills ── */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}>
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => handleModeChange(m.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '999px',
              border: mode === m.key ? '1.5px solid var(--accent, #6366f1)' : '1.5px solid var(--border-default, #334155)',
              background: mode === m.key ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: mode === m.key ? 'var(--accent, #6366f1)' : 'var(--text-secondary, #94a3b8)',
              fontWeight: mode === m.key ? 600 : 400,
              fontSize: 'var(--font-sm, 0.85rem)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      {/* ── Search input ── */}
      <div className="search-wrapper">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            className="search-input"
            type="text"
            style={{ border: 'none', background: 'transparent', flex: 1, padding: '1rem 0' }}
            placeholder={activeMode.placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* ── Status line ── */}
      <div className="search-meta">
        <span>{statusText}</span>
        <span>{loading && <span className="spinner" />}</span>
      </div>
    </div>
  );
}
