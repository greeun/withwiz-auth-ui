'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import type { ResetPasswordFormProps } from '../types';

export function ResetPasswordForm({
  token,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  loginUrl = '/login',
}: ResetPasswordFormProps) {
  const allMessages = getMessages(locale);
  const t = { ...allMessages.resetPassword, ...messageOverrides };
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const schema = z.object({
    password: z.string().min(8, { message: allMessages.register.passwordTooShort }),
    confirm: z.string(),
  }).refine((data) => data.password === data.confirm, {
    message: t.passwordMismatch,
    path: ['confirm'],
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

    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/reset-password`, { token, password: parsed.data.password });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError(allMessages.login.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ color: '#16a34a', fontSize: '14px' }}>{t.success}</p>
        <a href={loginUrl} style={{ marginTop: '16px', display: 'inline-block', fontSize: '14px', color: '#4f46e5' }}>
          {allMessages.forgotPassword.backToLogin}
        </a>
      </div>
    );
  }

  return (
    <div className={className} style={{ width: '100%', maxWidth: '384px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>{t.title}</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '24px' }}>{t.subtitle}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="wiz-reset-password" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.passwordLabel}</label>
          <input
            id="wiz-reset-password"
            type="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.password && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.password}</p>}
        </div>

        <div>
          <label htmlFor="wiz-reset-confirm" style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>{t.confirmLabel}</label>
          <input
            id="wiz-reset-confirm"
            type="password"
            placeholder={t.confirmPlaceholder}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            disabled={loading}
            style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          />
          {fieldErrors.confirm && <p style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.confirm}</p>}
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
    </div>
  );
}
