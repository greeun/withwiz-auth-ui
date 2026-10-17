'use client';

import { useState, type FormEvent } from 'react';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { cx } from '../utils/class-names';
import { readAuthError, networkAuthError, readJsonSafely } from '../utils/read-auth-error';
import { pickFieldErrors, formLevelText, fieldErrorA11y } from '../utils/form-errors';
import type { AuthErrorInfo, ForgotPasswordFormProps } from '../types';

export function ForgotPasswordForm({ locale = 'ko', messages: messageOverrides, apiBasePath = '/api/auth', className, classNames, unstyled = false, forceColorScheme, loginUrl = '/login', hooks }: ForgotPasswordFormProps) {
  const t = { ...getMessages(locale).forgotPassword, ...messageOverrides };
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** Shows a failure (form-level and per-field) and reports it through `hooks.onError`. */
  const fail = (info: AuthErrorInfo) => {
    const shown = pickFieldErrors(info, ['email']);
    setFieldErrors(shown);
    setError(formLevelText(info, shown));
    hooks?.onError?.(info.text, info);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (hooks?.onBeforeSubmit && !(await hooks.onBeforeSubmit({ email }))) return;
    setLoading(true);
    try {
      const res = await authPost(`${apiBasePath}/forgot-password`, { email });
      if (res.ok) {
        setSuccess(true);
        hooks?.onSuccess?.();
      } else {
        fail(readAuthError(res.status, await readJsonSafely(res), t.failed));
      }
    } catch {
      fail(networkAuthError(t.networkError));
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
          <input id="wiz-forgot-email" type="email" autoComplete="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className={cls('wiz-auth-input', classNames?.input)} {...fieldErrorA11y('wiz-forgot-email', fieldErrors.email)} />
          {fieldErrors.email && <p id="wiz-forgot-email-error" className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.email}</p>}
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
