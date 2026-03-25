import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import SearchBar from '../components/SearchBar';
import ResultsTable, { UserRow } from '../components/ResultsTable';
import UserDetailPanel from '../components/UserDetailPanel';

interface AuditEntry {
  id: string;
  timestamp: string;
  agentUsername: string;
  action: string;
  target?: string;
  details?: string;
}

export default function DashboardPage() {
  const { agent, logout } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUrn, setSelectedUrn] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchMode, setSearchMode] = useState<'name' | 'phone'>('phone');
  const [activeTab, setActiveTab] = useState<'search' | 'audit'>('search');
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const AUDIT_LIMIT = 50;

  const handleSearch = async (query: string, mode: 'name' | 'phone') => {
    setLoading(true);
    setHasSearched(true);
    setSearchMode(mode);
    try {
      const res = await api.get('/users/search', { params: { q: query, mode } });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Search failed:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (urn: string) => {
    setSelectedUrn(urn);
  };

  const handleClosePanel = () => {
    setSelectedUrn(null);
  };

  const loadAuditLog = async (page: number = auditPage) => {
    setAuditLoading(true);
    try {
      const res = await api.get('/audit', { params: { page, limit: AUDIT_LIMIT } });
      setAuditLog(res.data.entries);
      setAuditTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load audit log:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const switchToAudit = () => {
    setActiveTab('audit');
    loadAuditLog(1);
    setAuditPage(1);
  };
  
  const totalAuditPages = Math.ceil(auditTotal / AUDIT_LIMIT);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">🔒</div>
            <div>
              <h1>Account Recovery</h1>
              <span>Internal Support Dashboard</span>
            </div>
          </div>
        </div>
        <div className="dashboard-header-right">
          <div className="agent-badge">
            <span>👤 {agent?.username}</span>
            <span className="role">{agent?.role}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="dashboard-content">
        <div className="main-panel">
          {/* Tabs */}
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              🔍 User Search
            </button>
            {agent?.role === 'admin' && (
              <button
                className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={switchToAudit}
              >
                📋 Audit Log
              </button>
            )}
          </div>

          {activeTab === 'search' ? (
            <>
              <SearchBar
                onSearch={handleSearch}
                loading={loading}
                resultCount={users.length}
              />
              <ResultsTable
                users={users}
                selectedUrn={selectedUrn}
                onSelect={handleSelectUser}
                loading={loading}
                hasSearched={hasSearched}
                searchMode={searchMode}
              />
            </>
          ) : (
            <div className="results-container" style={{ overflow: 'auto' }}>
              {auditLoading ? (
                <div className="loading-state">
                  <span className="spinner" /> Loading audit log...
                </div>
              ) : (
                <>
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Agent</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map((entry) => (
                        <tr key={entry.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td>{entry.agentUsername}</td>
                          <td>
                            <span className={`action-badge ${entry.action}`}>
                              {entry.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td style={{ fontFamily: "'Courier New', monospace", fontSize: 'var(--font-xs)' }}>
                            {entry.target ? (entry.target.length > 20 ? `${entry.target.slice(0, 20)}...` : entry.target) : '—'}
                          </td>
                          <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {entry.details || '—'}
                          </td>
                        </tr>
                      ))}
                      {auditLog.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No audit entries yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {auditTotal > AUDIT_LIMIT && (
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1.5rem', borderTop: '1px solid var(--border)', background: 'var(--panel-bg)' }}>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        disabled={auditPage <= 1 || auditLoading} 
                        onClick={() => { const p = auditPage - 1; setAuditPage(p); loadAuditLog(p); }}
                      >
                        ← Previous
                      </button>
                      <span style={{ alignSelf: 'center', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                        Page {auditPage} of {totalAuditPages}
                      </span>
                      <button 
                        className="btn btn-ghost btn-sm" 
                        disabled={auditPage >= totalAuditPages || auditLoading} 
                        onClick={() => { const p = auditPage + 1; setAuditPage(p); loadAuditLog(p); }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        {selectedUrn && (
          <UserDetailPanel
            userUrn={selectedUrn}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  );
}
