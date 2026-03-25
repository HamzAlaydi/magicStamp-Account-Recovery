import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string, mode: 'name' | 'phone' | 'magic') => void;
  loading: boolean;
  resultCount: number;
}

export default function SearchBar({ onSearch, loading, resultCount }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'name' | 'phone' | 'magic'>('phone');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (query.trim().length >= 2) {
      timerRef.current = setTimeout(() => {
        onSearch(query.trim(), mode);
      }, 300);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, mode]);

  return (
    <div>
      <div className="tab-nav" style={{ marginBottom: '0.75rem' }}>
        <button
          className={`tab-btn ${['phone', 'magic'].includes(mode) ? 'active' : ''}`}
          onClick={() => setMode('phone')}
        >
          📱 Identity Search
        </button>
        <button
          className={`tab-btn ${mode === 'name' ? 'active' : ''}`}
          onClick={() => setMode('name')}
        >
          👤 Search by Name / Email
        </button>
      </div>
      <div className="search-container" style={{ display: 'flex', gap: '0.5rem', background: 'transparent', padding: 0, boxShadow: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '12px', padding: '0 1rem', flex: 1, border: '1px solid var(--border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
          <span className="search-icon">🔍</span>
          <input
            id="search-input"
            className="search-input"
            type="text"
            style={{ border: 'none', background: 'transparent', flex: 1, padding: '1rem 0' }}
            placeholder={
              mode === 'phone' ? 'Enter phone number (e.g. 79133...)' :
              mode === 'magic' ? 'Enter first 4 digits of URN (e.g. 03db)' :
              'Search by name, email address...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        {['phone', 'magic'].includes(mode) && (
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as 'phone' | 'magic')}
            style={{ padding: '0 1rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--panel-bg)', color: 'var(--text-primary)', outline: 'none', fontSize: 'var(--font-sm)', fontWeight: 500 }}
          >
            <option value="phone">Phone Number</option>
            <option value="magic">Magic ID</option>
          </select>
        )}
      </div>
      <div className="search-meta">
        <span>
          {loading ? 'Searching...' : query.length >= 2 ? `${resultCount} result${resultCount !== 1 ? 's' : ''} found` : 'Enter at least 2 characters to search'}
        </span>
        <span>{loading && <span className="spinner" />}</span>
      </div>
    </div>
  );
}
