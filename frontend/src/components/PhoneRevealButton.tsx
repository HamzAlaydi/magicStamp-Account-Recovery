import React, { useState, useEffect, useRef } from 'react';

interface PhoneRevealButtonProps {
  disabled: boolean;
  onReveal: () => Promise<{ phone: string; masked_phone: string }>;
}

export default function PhoneRevealButton({ disabled, onReveal }: PhoneRevealButtonProps) {
  const [revealed, setRevealed] = useState(false);
  const [phone, setPhone] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    // Reset when disabled changes (new user selected)
    if (disabled) {
      setRevealed(false);
      setPhone('');
      setMaskedPhone('');
      setCountdown(30);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [disabled]);

  const handleReveal = async () => {
    setLoading(true);
    try {
      const result = await onReveal();
      setPhone(result.phone);
      setMaskedPhone(result.masked_phone);
      setRevealed(true);
      setCountdown(30);

      // Start countdown
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setRevealed(false);
            setPhone('');
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (revealed) {
    return (
      <div className="phone-reveal-section">
        <h4>📱 Phone Number</h4>
        <div className="revealed-phone">
          <span className="number">{phone}</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
        <div className="timer-text">
          Auto-hiding in {countdown}s
        </div>
      </div>
    );
  }

  return (
    <div className="phone-reveal-section">
      <h4>📱 Phone Number Recovery</h4>
      <button
        className="btn btn-reveal"
        disabled={disabled || loading}
        onClick={handleReveal}
      >
        {loading ? <span className="spinner" /> : '🔓'}
        {loading ? 'Retrieving...' : disabled ? 'Verify Identity First' : 'Reveal Phone Number'}
      </button>
      {disabled && (
        <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          Complete identity verification above to unlock
        </p>
      )}
    </div>
  );
}
