'use client';

import { useEffect, useState } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { EmailVerificationFormProps } from '../types';

export function EmailVerificationForm({
  token,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  loginUrl = '/login',
  resendUrl = '/resend-verification',
}: EmailVerificationFormProps) {
  const t = { ...getMessages(locale).emailVerification, ...messageOverrides };
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      try {
        const res = await authPost(`${apiBasePath}/verify-email`, { token });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage(data.error ?? t.errorInvalid);
        }
      } catch {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(t.networkError);
      }
    }

    verify();
    return () => { cancelled = true; };
  }, [token, apiBasePath]);

  if (status === 'loading') {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: 'wiz-spin 1s linear infinite', margin: '0 auto 16px' }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#d1d5db" strokeWidth="4" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="#4f46e5" strokeWidth="4" strokeDasharray="80" strokeDashoffset="60" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>{t.verifying}</p>
        <style>{`@keyframes wiz-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 16px' }}>
          <circle cx="24" cy="24" r="22" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
          <path d="M15 24l6 6 12-12" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>{t.successTitle}</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{t.successMessage}</p>
        <a
          href={loginUrl}
          style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
        >
          {t.loginButton}
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={{ textAlign: 'center', padding: '48px 24px' }}>
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto 16px' }}>
        <circle cx="24" cy="24" r="22" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
        <path d="M17 17l14 14M31 17l-14 14" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>{t.errorTitle}</h2>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{errorMessage}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <a
          href={resendUrl}
          style={{ fontSize: '14px', color: '#4f46e5', textDecoration: 'none' }}
        >
          {t.resendLink}
        </a>
        <a
          href={loginUrl}
          style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}
        >
          {t.loginButton}
        </a>
      </div>
    </div>
  );
}
