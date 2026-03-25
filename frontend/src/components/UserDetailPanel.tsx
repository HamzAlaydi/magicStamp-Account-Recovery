import React, { useState, useEffect } from 'react';
import api from '../api/client';

interface Identity {
  urn: string;
  provider: string;
  auth_id: string;
}

interface UserInfo {
  urn: string;
  first_name: string;
  last_name: string;
  email_address: string;
}

interface UserDetailPanelProps {
  userUrn: string;
  onClose: () => void;
}

export default function UserDetailPanel({ userUrn, onClose }: UserDetailPanelProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [userUrn]);

  const fetchUser = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/users/${userUrn}`);
      setUser(res.data.user);
      setIdentities(res.data.identities);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const getProviderClass = (provider: string): string => {
    if (provider === 'twilio_phone_number' || provider === 'phone') return 'phone';
    if (provider === 'email') return 'email';
    return 'other';
  };

  const getProviderLabel = (provider: string): string => {
    if (provider === 'twilio_phone_number') return 'PHONE';
    if (provider === 'auth0') return 'AUTH0';
    return provider.toUpperCase();
  };

  const handleCopy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  if (loading) {
    return (
      <div className="side-panel">
        <div className="side-panel-header">
          <h2>User Details</h2>
          <button className="side-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="loading-state">
          <span className="spinner" /> Loading...
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="side-panel">
        <div className="side-panel-header">
          <h2>User Details</h2>
          <button className="side-panel-close" onClick={onClose}>✕</button>
        </div>
        <div className="results-empty">
          <div className="icon">⚠️</div>
          <p>{error || 'User not found'}</p>
        </div>
      </div>
    );
  }

  const initials = `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`.toUpperCase();
  const phoneIdentities = identities.filter(id => id.provider === 'twilio_phone_number');

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>User Details</h2>
        <button className="side-panel-close" onClick={onClose}>✕</button>
      </div>

      <div className="side-panel-content">
        {/* User Info Card */}
        <div className="user-info-card">
          <div className="user-avatar">{initials || '?'}</div>
          <h3>{user.first_name} {user.last_name}</h3>
          <p className="urn">{user.urn}</p>
          <div style={{ marginTop: '1rem' }}>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email_address || '—'}</span>
            </div>
          </div>
        </div>

        {/* Phone Numbers — shown directly */}
        {phoneIdentities.length > 0 && (
          <div className="phone-reveal-section" style={{ textAlign: 'left' }}>
            <h4>📱 Phone Number{phoneIdentities.length > 1 ? 's' : ''}</h4>
            {phoneIdentities.map((id) => (
              <div className="revealed-phone" key={id.urn} style={{ justifyContent: 'space-between' }}>
                <span className="number">{id.auth_id}</span>
                <button className="copy-btn" onClick={() => handleCopy(id.auth_id)}>
                  📋 Copy
                </button>
              </div>
            ))}
          </div>
        )}

        {/* All Identities */}
        <div className="identities-section">
          <h4>All Identities ({identities.length})</h4>
          {identities.map((id) => (
            <div className="identity-card" key={id.urn}>
              <span className={`identity-provider ${getProviderClass(id.provider)}`}>
                {getProviderLabel(id.provider)}
              </span>
              <span className="identity-value">{id.auth_id}</span>
            </div>
          ))}
          {identities.length === 0 && (
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>No identities found</p>
          )}
        </div>
      </div>
    </div>
  );
}
