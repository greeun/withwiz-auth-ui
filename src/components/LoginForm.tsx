'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { LoginFormProps } from '../types';

export function LoginForm({
  providers = [],
  redirectAfterLogin = '/',
  showMagicLink = false,
  showForgotPassword = true,
  showSignupLink = true,
  title,
  subtitle,
  locale = 'ko',
  messages: messageOverrides,
  className,
  unstyled = false,
  slots,
  hooks,
  apiBasePath = '/api/auth',
}: LoginFormProps) {
  const t = { ...getMessages(locale).login, ...messageOverrides };
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const schema = z.object({
    email: z.string().email({ message: t.invalidEmail }),
    password: z.string().min(6, { message: t.passwordTooShort }),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFieldErrors(errs);
      return;
    }

    if (hooks?.onBeforeSubmit) {
      const proceed = await hooks.onBeforeSubmit(parsed.data);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/login`, parsed.data);
      const data = await res.json();

      if (!res.ok) {
        const msg = data.code === 'EMAIL_NOT_VERIFIED' ? t.emailNotVerified : (data.error ?? t.invalidCredentials);
        setError(msg);
        hooks?.onError?.(msg);
        return;
      }

      hooks?.onSuccess?.(data.user);
      window.location.href = redirectAfterLogin;
    } catch {
      setError(t.networkError);
      hooks?.onError?.(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  const baseClass = unstyled ? '' : 'wiz-auth-form';

  return (
    <div className={`${baseClass} ${className ?? ''}`} style={unstyled ? undefined : { width: '100%', maxWidth: '384px', margin: '0 auto' }}>
      {slots?.header ?? (
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{title ?? t.title}</h1>
          {(subtitle ?? t.subtitle) && <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>{subtitle ?? t.subtitle}</p>}
        </div>
      )}

      {slots?.beforeForm}

      {providers.length > 0 && (
        <>
          {slots?.oauthSection ?? <OAuthButtons providers={providers} mode="login" apiBasePath={apiBasePath} />}
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{t.orDivider}</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="wiz-login-email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.emailLabel}</label>
          <input
            id="wiz-login-email"
            type="email"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.email && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="wiz-login-password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.passwordLabel}</label>
          <input
            id="wiz-login-password"
            type="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.password && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.password}</p>}
        </div>

        {error && <div style={{ padding: '12px', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '6px' }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ width: '100%', height: '40px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showForgotPassword && (
        <p style={{ marginTop: '12px', textAlign: 'center', fontSize: '14px' }}>
          <a href="/forgot-password" style={{ color: '#4f46e5' }}>{t.forgotPassword}</a>
        </p>
      )}

      {showMagicLink && (
        <button
          type="button"
          onClick={() => { window.location.href = '/auth/magic-link'; }}
          style={{ marginTop: '8px', width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', backgroundColor: '#fff', cursor: 'pointer' }}
        >
          {t.continueWithMagicLink}
        </button>
      )}

      {showSignupLink && (
        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          {t.noAccount} <a href="/signup" style={{ color: '#4f46e5' }}>{t.signUp}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
