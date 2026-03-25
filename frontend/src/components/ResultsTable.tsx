import React from 'react';

export interface UserRow {
  urn: string;
  first_name: string;
  last_name: string;
  email_address?: string;
  phone?: string;
  createdAt?: string;
  provider?: string;
}

interface ResultsTableProps {
  users: UserRow[];
  selectedUrn: string | null;
  onSelect: (urn: string) => void;
  loading: boolean;
  hasSearched: boolean;
  searchMode: 'name' | 'phone';
}

export default function ResultsTable({ users, selectedUrn, onSelect, loading, hasSearched, searchMode }: ResultsTableProps) {
  if (loading) {
    return (
      <div className="results-container">
        <div className="loading-state">
          <span className="spinner" />
          Loading results...
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="results-container">
        <div className="results-empty">
          <div className="icon">🔎</div>
          <p>Search for a user to get started</p>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="results-container">
        <div className="results-empty">
          <div className="icon">📭</div>
          <p>No users found matching your search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <table className="results-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            {searchMode === 'phone' && <th>Phone</th>}
            <th>URN</th>
            {searchMode === 'phone' && <th>Created At</th>}
            {searchMode === 'phone' && <th>Provider</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.urn + (user.phone || '')}
              className={selectedUrn === user.urn ? 'active' : ''}
              onClick={() => onSelect(user.urn)}
            >
              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {user.first_name} {user.last_name}
              </td>
              <td style={{ fontFamily: "'Courier New', monospace" }}>{user.email_address || '—'}</td>
              {searchMode === 'phone' && (
                <td style={{ fontFamily: "'Courier New', monospace", color: 'var(--success)' }}>
                  {user.phone || '—'}
                </td>
              )}
              <td style={{ fontSize: 'var(--font-xs)', fontFamily: "'Courier New', monospace", color: 'var(--text-muted)' }}>
                {user.urn.length > 20 ? `${user.urn.slice(0, 20)}...` : user.urn}
              </td>
              {searchMode === 'phone' && (
                <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </td>
              )}
              {searchMode === 'phone' && (
                <td style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  {user.provider || '—'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
