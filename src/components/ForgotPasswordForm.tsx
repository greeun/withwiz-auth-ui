'use client';

import { useState, type FormEvent } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { ForgotPasswordFormProps } from '../types';

export function ForgotPasswordForm({ locale = 'ko', messages: messageOverrides, apiBasePath = '/api/auth', className, loginUrl = '/login' }: ForgotPasswordFormProps) {
  const t = { ...getMessages(locale).forgotPassword, ...messageOverrides };
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await authPost(`${apiBasePath}/forgot-password`, { email });
      if (res.ok) setSuccess(true);
      else {
        const data = await res.json();
        setError(data.error ?? 'Failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#16a34a', fontSize: '14px' }}>{t.success}</p>
        <a href={loginUrl} style={{ marginTop: '16px', display: 'inline-block', fontSize: '14px', color: '#4f46e5' }}>{t.backToLogin}</a>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', maxWidth: '384px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>{t.title}</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '24px' }}>{t.subtitle}</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="wiz-forgot-email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.emailLabel}</label>
          <input id="wiz-forgot-email" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
        </div>
        {error && <div style={{ padding: '12px', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '6px' }}>{error}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', height: '40px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>
      <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px' }}>
        <a href={loginUrl} style={{ color: '#4f46e5' }}>{t.backToLogin}</a>
      </p>
    </div>
  );
}
