import React from 'react';

export interface UserRow {
  urn: string;
  first_name: string;
  last_name: string;
  email_address?: string;
  email_verified?: boolean;
  created?: string;
  modified?: string;
  phone?: string;
  createdAt?: string;
  provider?: string;
  // Event-specific fields
  customer_urn?: string;
  event_type?: string;
  event_timestamp?: string;
  outlet_urn?: string;
  loyalty_scheme_slug?: string;
  is_blocked?: boolean;
  has_auth_user?: boolean;
}

interface ResultsTableProps {
  users: UserRow[];
  selectedUrn: string | null;
  onSelect: (urn: string) => void;
  loading: boolean;
  hasSearched: boolean;
  searchMode: 'name' | 'phone' | 'magic' | 'event';
}

const mono = { fontFamily: "'Courier New', monospace" };
const muted = { fontSize: 'var(--font-xs)', color: 'var(--text-muted)' };
const monoMuted = { ...mono, ...muted };

function Badge({ yes, yesLabel, noLabel, yesColor = 'var(--success)', noColor = 'var(--warning, #fbbf24)' }: {
  yes: boolean; yesLabel: string; noLabel: string; yesColor?: string; noColor?: string;
}) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: 'var(--font-xs)',
      fontWeight: 600,
      background: yes ? `${yesColor}22` : `${noColor}22`,
      color: yes ? yesColor : noColor,
    }}>
      {yes ? yesLabel : noLabel}
    </span>
  );
}

function truncateUrn(urn: string, max = 20) {
  return urn.length > max ? `${urn.slice(0, max)}...` : urn;
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

  // ─── Event URN mode ────────────────────────────────────
  if (searchMode === 'event') {
    return (
      <div className="results-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone (Parktech)</th>
              <th>Blocked</th>
              <th>Customer URN</th>
              <th>Event Type</th>
              <th>Event Time</th>
              <th>Outlet URN</th>
              <th>Loyalty Scheme</th>
              <th>Auth Linked</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.urn + (user.customer_urn || '')}
                className={selectedUrn === user.urn ? 'active' : ''}
                onClick={() => onSelect(user.urn)}
              >
                <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {user.first_name} {user.last_name}
                </td>
                <td style={mono}>{user.email_address || '—'}</td>
                <td style={{ ...mono, color: 'var(--success)' }}>{user.phone || '—'}</td>
                <td>
                  <Badge yes={!!user.is_blocked} yesLabel="🚫 Yes" noLabel="✓ No"
                    yesColor="var(--danger, #ef4444)" noColor="var(--success)" />
                </td>
                <td style={monoMuted}>{truncateUrn(user.customer_urn || '—')}</td>
                <td>
                  <span className={`action-badge ${user.event_type || ''}`}>
                    {user.event_type || '—'}
                  </span>
                </td>
                <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                  {user.event_timestamp ? new Date(user.event_timestamp).toLocaleString() : '—'}
                </td>
                <td style={monoMuted}>{truncateUrn(user.outlet_urn || '—', 16)}</td>
                <td style={muted}>{user.loyalty_scheme_slug || '—'}</td>
                <td>
                  <Badge yes={!!user.has_auth_user} yesLabel="✓ Yes" noLabel="✗ No" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── Phone / Magic mode ────────────────────────────────
  if (['phone', 'magic'].includes(searchMode)) {
    return (
      <div className="results-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Email Verified</th>
              <th>Phone</th>
              <th>Provider</th>
              <th>URN</th>
              <th>User Created</th>
              <th>User Modified</th>
              <th>Identity Created</th>
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
                <td style={mono}>{user.email_address || '—'}</td>
                <td>
                  <Badge yes={!!user.email_verified} yesLabel="✓ Yes" noLabel="✗ No" />
                </td>
                <td style={{ ...mono, color: 'var(--success)' }}>{user.phone || '—'}</td>
                <td style={muted}>{user.provider || '—'}</td>
                <td style={monoMuted}>{truncateUrn(user.urn)}</td>
                <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                  {user.created ? new Date(user.created).toLocaleString() : '—'}
                </td>
                <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                  {user.modified ? new Date(user.modified).toLocaleString() : '—'}
                </td>
                <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── Name / Email mode ─────────────────────────────────
  return (
    <div className="results-container">
      <table className="results-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Email Verified</th>
            <th>Phone</th>
            <th>Provider</th>
            <th>URN</th>
            <th>Created</th>
            <th>Modified</th>
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
              <td style={mono}>{user.email_address || '—'}</td>
              <td>
                <Badge yes={!!user.email_verified} yesLabel="✓ Yes" noLabel="✗ No" />
              </td>
              <td style={{ ...mono, color: 'var(--success)' }}>{user.phone || '—'}</td>
              <td style={muted}>{user.provider || '—'}</td>
              <td style={monoMuted}>{truncateUrn(user.urn)}</td>
              <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                {user.created ? new Date(user.created).toLocaleString() : '—'}
              </td>
              <td style={{ ...muted, whiteSpace: 'nowrap' }}>
                {user.modified ? new Date(user.modified).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
