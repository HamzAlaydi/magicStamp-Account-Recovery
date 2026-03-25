import React, { useState, useEffect, useRef, FormEvent } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type LoginMode = 'select' | 'admin' | 'otp-request' | 'otp-verify';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<LoginMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => { return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }; }, []);

  const handleAdminLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.agent);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/request-otp', { email });
      setMessage(res.data.message);
      setIsFirstTime(res.data.isFirstTime);
      setMode('otp-verify');
      startCooldown();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, code: otpCode });
      login(res.data.token, res.data.agent);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderSelect = () => (
    <>
      <div className="login-header">
        <div className="login-icon">🔒</div>
        <h1>Account Recovery</h1>
        <p>Internal support dashboard</p>
      </div>
      <button
        className="btn btn-primary"
        onClick={() => setMode('admin')}
        style={{ marginBottom: '0.75rem' }}
      >
        🔑 Admin Login
      </button>
      <button
        className="btn btn-ghost"
        onClick={() => setMode('otp-request')}
        style={{ width: '100%' }}
      >
        📧 Team Login (OTP)
      </button>
    </>
  );

  const renderAdminLogin = () => (
    <form onSubmit={handleAdminLogin}>
      <div className="login-header">
        <div className="login-icon">🔑</div>
        <h1>Admin Login</h1>
        <p>Enter your admin credentials</p>
      </div>
      {error && <div className="toast error" style={{ position: 'static', marginBottom: '1rem', animation: 'none' }}>{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="admin-email">Email</label>
        <input id="admin-email" className="form-input" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="admin-password">Password</label>
        <input id="admin-password" className="form-input" type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading || !email || !password}>
        {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => { setMode('select'); setError(''); }} style={{ width: '100%', marginTop: '0.75rem' }}>
        ← Back
      </button>
    </form>
  );

  const renderOtpRequest = () => (
    <form onSubmit={handleRequestOtp}>
      <div className="login-header">
        <div className="login-icon">📧</div>
        <h1>Team Login</h1>
        <p>Enter your email to receive an OTP</p>
      </div>
      {error && <div className="toast error" style={{ position: 'static', marginBottom: '1rem', animation: 'none' }}>{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="otp-email">Your Email</label>
        <input id="otp-email" className="form-input" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading || !email}>
        {loading ? <><span className="spinner" /> Requesting OTP...</> : 'Request OTP'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => { setMode('select'); setError(''); }} style={{ width: '100%', marginTop: '0.75rem' }}>
        ← Back
      </button>
    </form>
  );

  const renderOtpVerify = () => (
    <form onSubmit={handleVerifyOtp}>
      <div className="login-header">
        <div className="login-icon">🔐</div>
        <h1>Enter OTP</h1>
        <p>{email}</p>
      </div>
      {message && (
        <div className="toast success" style={{ position: 'static', marginBottom: '1rem', animation: 'none' }}>
          {message}
        </div>
      )}
      {isFirstTime && (
        <div className="toast" style={{ position: 'static', marginBottom: '1rem', animation: 'none', background: 'var(--warning-bg)', border: '1px solid rgba(251,191,36,0.3)', color: 'var(--warning)' }}>
          ⚠️ First-time login — OTP was sent to administrators. Contact an admin to get your code.
        </div>
      )}
      {error && <div className="toast error" style={{ position: 'static', marginBottom: '1rem', animation: 'none' }}>{error}</div>}
      <div className="form-group">
        <label className="form-label" htmlFor="otp-code">OTP Code</label>
        <input
          id="otp-code"
          className="form-input"
          type="text"
          placeholder="Enter 6-digit code"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
          required
          style={{ fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px', fontWeight: 700 }}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={loading || otpCode.length !== 6}>
        {loading ? <><span className="spinner" /> Verifying...</> : 'Verify & Login'}
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={resendCooldown > 0 || loading}
        onClick={async () => {
          setError('');
          setLoading(true);
          try {
            const res = await api.post('/auth/request-otp', { email });
            setMessage(res.data.message);
            startCooldown();
          } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
          } finally {
            setLoading(false);
          }
        }}
        style={{ width: '100%', marginTop: '0.75rem' }}
      >
        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : '🔄 Resend OTP'}
      </button>
      <button type="button" className="btn btn-ghost" onClick={() => { setMode('otp-request'); setError(''); setMessage(''); setOtpCode(''); if (cooldownRef.current) clearInterval(cooldownRef.current); }} style={{ width: '100%', marginTop: '0.5rem' }}>
        ← Back
      </button>
    </form>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        {mode === 'select' && renderSelect()}
        {mode === 'admin' && renderAdminLogin()}
        {mode === 'otp-request' && renderOtpRequest()}
        {mode === 'otp-verify' && renderOtpVerify()}
      </div>
    </div>
  );
}
