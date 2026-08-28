'use client';

import { useState, type FormEvent } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import type { ForgotPasswordFormProps } from '../types';

export function ForgotPasswordForm({ locale = 'ko', messages: messageOverrides, apiBasePath = '/api/auth', className, classNames, unstyled = false, forceColorScheme, loginUrl = '/login' }: ForgotPasswordFormProps) {
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

  /** Package class only when styled; consumer slot always. */
  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  if (success) {
    return (
      <div className={cls('wiz-auth-success', classNames?.success)} data-wiz-scheme={forceColorScheme}>
        <p className={cls('wiz-auth-success-text', classNames?.successText)}>{t.success}</p>
        <a href={loginUrl} className={cls('wiz-auth-link', classNames?.link)}>{t.backToLogin}</a>
      </div>
    );
  }

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      <h1 className={cls('wiz-auth-title', classNames?.title)}>{t.title}</h1>
      <p className={cls('wiz-auth-subtitle', classNames?.subtitle)}>{t.subtitle}</p>
      <form onSubmit={handleSubmit} className={cls('wiz-auth-fields', classNames?.form)}>
        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-forgot-email" className={cls('wiz-auth-label', classNames?.label)}>{t.emailLabel}</label>
          <input id="wiz-forgot-email" type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className={cls('wiz-auth-input', classNames?.input)} />
        </div>
        {error && <div className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}
        <button type="submit" disabled={loading} className={cls('wiz-auth-submit', classNames?.submitButton)}>
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>
      <p className={cls('wiz-auth-footer', classNames?.footer)}>
        <a href={loginUrl} className={cls('wiz-auth-link', classNames?.link)}>{t.backToLogin}</a>
      </p>
    </div>
  );
}
