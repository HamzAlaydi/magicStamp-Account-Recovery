import React, { useState, FormEvent } from 'react';

interface VerificationCheck {
  field: string;
  passed: boolean;
}

interface VerificationChecklistProps {
  userUrn: string;
  onVerify: (answers: { email?: string; firstName?: string; lastName?: string }) => Promise<{ verified: boolean; checks: VerificationCheck[] }>;
  onVerified: (verified: boolean) => void;
}

export default function VerificationChecklist({ userUrn, onVerify, onVerified }: VerificationChecklistProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [checks, setChecks] = useState<VerificationCheck[]>([]);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await onVerify({
        email: email || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      setChecks(result.checks);
      setVerified(result.verified);
      onVerified(result.verified);
    } catch {
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (field: string): 'pending' | 'passed' | 'failed' => {
    if (checks.length === 0) return 'pending';
    const check = checks.find((c) => c.field === field);
    if (!check) return 'pending';
    return check.passed ? 'passed' : 'failed';
  };

  const statusIcon = (status: 'pending' | 'passed' | 'failed') => {
    switch (status) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      default: return '?';
    }
  };

  return (
    <div className="verification-section">
      <h4>🛡️ Identity Verification</h4>
      <form className="verification-form" onSubmit={handleSubmit}>
        <div className="verify-field">
          <span className={`verify-status ${getStatus('email')}`}>{statusIcon(getStatus('email'))}</span>
          <input
            className="form-input"
            type="email"
            placeholder="User's email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="verify-field">
          <span className={`verify-status ${getStatus('firstName')}`}>{statusIcon(getStatus('firstName'))}</span>
          <input
            className="form-input"
            type="text"
            placeholder="User's first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="verify-field">
          <span className={`verify-status ${getStatus('lastName')}`}>{statusIcon(getStatus('lastName'))}</span>
          <input
            className="form-input"
            type="text"
            placeholder="User's last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || (!email && !firstName && !lastName)}
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Verifying...' : 'Verify Identity'}
        </button>
      </form>
      {verified !== null && (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            background: verified ? 'var(--success-bg)' : 'var(--error-bg)',
            color: verified ? 'var(--success)' : 'var(--error)',
            border: `1px solid ${verified ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          }}
        >
          {verified ? '✅ Identity verified — phone reveal unlocked' : '❌ Verification failed — at least 2 correct answers required'}
        </div>
      )}
    </div>
  );
}
