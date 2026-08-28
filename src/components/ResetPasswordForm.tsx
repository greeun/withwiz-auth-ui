'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { getMessages } from '../i18n';
import { authPost } from '../utils/api-client';
import { emailFromLink } from '../utils/link-email';
import { cx } from '../utils/class-names';
import type { ResetPasswordFormProps } from '../types';

export function ResetPasswordForm({
  token,
  email,
  locale = 'ko',
  messages: messageOverrides,
  apiBasePath = '/api/auth',
  className,
  classNames,
  unstyled = false,
  forceColorScheme,
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
    password: z.string().min(8, { message: allMessages.signup.passwordTooShort }),
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
      // The endpoint matches token **and** email; sending the token alone is rejected
      // as malformed before the token is ever checked.
      const account = email ?? emailFromLink();
      const payload = { token, password: parsed.data.password };
      const res = await authPost(`${apiBasePath}/reset-password`, account ? { email: account, ...payload } : payload);
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

  /** Package class only when styled; consumer slot always. */
  const cls = (base: string, slot?: string) => cx(unstyled ? undefined : base, slot);

  if (success) {
    return (
      <div className={cls('wiz-auth-success', classNames?.success)} data-wiz-scheme={forceColorScheme}>
        <p className={cls('wiz-auth-success-text', classNames?.successText)}>{t.success}</p>
        <a href={loginUrl} className={cls('wiz-auth-link', classNames?.link)}>{allMessages.forgotPassword.backToLogin}</a>
      </div>
    );
  }

  return (
    <div className={cls('wiz-auth-form', cx(className, classNames?.root))} data-wiz-scheme={forceColorScheme}>
      <h1 className={cls('wiz-auth-title', classNames?.title)}>{t.title}</h1>
      <p className={cls('wiz-auth-subtitle', classNames?.subtitle)}>{t.subtitle}</p>

      <form onSubmit={handleSubmit} className={cls('wiz-auth-fields', classNames?.form)}>
        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-reset-password" className={cls('wiz-auth-label', classNames?.label)}>{t.passwordLabel}</label>
          <input
            id="wiz-reset-password"
            type="password"
            placeholder={t.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
          />
          {fieldErrors.password && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.password}</p>}
        </div>

        <div className={cls('wiz-auth-field', classNames?.field)}>
          <label htmlFor="wiz-reset-confirm" className={cls('wiz-auth-label', classNames?.label)}>{t.confirmLabel}</label>
          <input
            id="wiz-reset-confirm"
            type="password"
            placeholder={t.confirmPlaceholder}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            disabled={loading}
            className={cls('wiz-auth-input', classNames?.input)}
          />
          {fieldErrors.confirm && <p className={cls('wiz-auth-field-error', classNames?.fieldError)}>{fieldErrors.confirm}</p>}
        </div>

        {error && <div className={cls('wiz-auth-error', classNames?.error)}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className={cls('wiz-auth-submit', classNames?.submitButton)}
        >
          {loading ? t.submitting : t.submitButton}
        </button>
      </form>
    </div>
  );
}
