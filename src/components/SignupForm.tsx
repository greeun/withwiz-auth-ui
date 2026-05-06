'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { OAuthButtons } from './OAuthButtons';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { SignupFormProps } from '../types';

export function SignupForm({
  providers = [],
  redirectAfterSignup,
  showLoginLink = true,
  locale = 'ko',
  messages: messageOverrides,
  className,
  unstyled = false,
  extraFields = [],
  slots,
  hooks,
  apiBasePath = '/api/auth',
}: SignupFormProps) {
  const t = { ...getMessages(locale).register, ...messageOverrides };
  const [form, setForm] = useState<Record<string, string>>({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = z.object({
    name: z.string().min(2, { message: t.nameTooShort }),
    email: z.string().email({ message: t.invalidEmail }),
    password: z.string().min(8, { message: t.passwordTooShort }),
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
      const proceed = await hooks.onBeforeSubmit(form);
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/register`, form);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t.registrationFailed);
        hooks?.onError?.(data.error);
        return;
      }

      setSuccess(true);
      hooks?.onSuccess?.(data.user);

      if (redirectAfterSignup) {
        setTimeout(() => { window.location.href = redirectAfterSignup; }, 3000);
      }
    } catch {
      setError(t.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a' }}>{t.successTitle}</h2>
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>{t.successMessage}</p>
      </div>
    );
  }

  const baseClass = unstyled ? '' : 'wiz-auth-form';

  return (
    <div className={`${baseClass} ${className ?? ''}`} style={unstyled ? undefined : { width: '100%', maxWidth: '384px', margin: '0 auto' }}>
      {slots?.header ?? (
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>{t.title}</h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>{t.subtitle}</p>
        </div>
      )}

      {slots?.beforeForm}

      {providers.length > 0 && (
        <>
          {slots?.oauthSection ?? <OAuthButtons providers={providers} mode="register" apiBasePath={apiBasePath} />}
          <div style={{ margin: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>{t.orDivider}</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e5e7eb' }} />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="wiz-register-name" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.nameLabel}</label>
          <input id="wiz-register-name" type="text" placeholder={t.namePlaceholder} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={loading} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          {fieldErrors.name && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="wiz-register-email" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.emailLabel}</label>
          <input id="wiz-register-email" type="email" placeholder={t.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={loading} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          {fieldErrors.email && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="wiz-register-password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.passwordLabel}</label>
          <input id="wiz-register-password" type="password" placeholder={t.passwordPlaceholder} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={loading} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          {fieldErrors.password && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.password}</p>}
        </div>

        {extraFields.map((field) => (
          <div key={field.name}>
            <label htmlFor={`wiz-register-${field.name}`} style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{field.label}</label>
            <input id={`wiz-register-${field.name}`} type={field.type ?? 'text'} placeholder={field.placeholder} value={form[field.name] ?? ''} onChange={(e) => setForm({ ...form, [field.name]: e.target.value })} required={field.required} disabled={loading} style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          </div>
        ))}

        {error && <div style={{ padding: '12px', fontSize: '14px', color: '#dc2626', backgroundColor: '#fef2f2', borderRadius: '6px' }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: '100%', height: '40px', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '6px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>

      {showLoginLink && (
        <p style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          {t.alreadyHaveAccount} <a href="/login" style={{ color: '#4f46e5' }}>{t.signIn}</a>
        </p>
      )}

      {slots?.afterForm}
      {slots?.footer}
    </div>
  );
}
